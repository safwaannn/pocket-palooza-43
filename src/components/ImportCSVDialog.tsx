import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, AlertCircle, CheckCircle2 } from "lucide-react";

import { supabase } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  invalidateMoneyViews,
  useCategories,
  type Category,
} from "@/lib/finance-queries";
import {
  parseTransactionsCSV,
  type ParsedTransaction,
} from "@/lib/csv-import";

type PreviewState =
  | { status: "idle" }
  | { status: "parsed"; rows: ParsedTransaction[]; errors: { line: number; error: string }[]; unknownCategories: string[] };

const buildCategoryIndex = (categories: Category[]) => {
  const map = new Map<string, string>();
  categories.forEach((c) => {
    map.set(`${c.type}:${c.name.trim().toLowerCase()}`, c.id);
  });
  return map;
};

export function ImportCSVDialog({ trigger }: { trigger: React.ReactNode }) {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({ status: "idle" });
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reset = () => {
    setPreview({ status: "idle" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const { valid, errors } = parseTransactionsCSV(text);
    const catIndex = buildCategoryIndex(categories);
    const unknown = Array.from(
      new Set(
        valid
          .filter((r) => !catIndex.has(`${r.type}:${r.category.toLowerCase()}`))
          .map((r) => `${r.category} (${r.type})`),
      ),
    );
    setPreview({ status: "parsed", rows: valid, errors, unknownCategories: unknown });
  };

  const importMut = useMutation({
    mutationFn: async () => {
      if (preview.status !== "parsed") throw new Error("No file parsed");
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const userId = userData.user.id;

      // Ensure a category exists for every (type, name) referenced by the CSV.
      // Missing user-scoped ones get auto-created so imports don't hard-fail.
      const catIndex = buildCategoryIndex(categories);
      const toCreate = new Map<string, { name: string; type: "income" | "expense" }>();
      for (const row of preview.rows) {
        const key = `${row.type}:${row.category.toLowerCase()}`;
        if (!catIndex.has(key)) {
          toCreate.set(key, { name: row.category, type: row.type });
        }
      }

      if (toCreate.size) {
        const { data: created, error } = await supabase
          .from("categories")
          .insert(
            Array.from(toCreate.values()).map((c) => ({
              name: c.name,
              type: c.type,
              user_id: userId,
            })),
          )
          .select("id,user_id,name,type");
        if (error) throw error;
        (created ?? []).forEach((c) =>
          catIndex.set(`${c.type}:${c.name.trim().toLowerCase()}`, c.id),
        );
      }

      const payload = preview.rows.map((row) => ({
        user_id: userId,
        type: row.type,
        amount: row.amount,
        category_id: catIndex.get(`${row.type}:${row.category.toLowerCase()}`) ?? null,
        date: row.date,
        note: row.note || null,
      }));

      // Chunk inserts to keep individual requests small.
      const chunkSize = 200;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase.from("transactions").insert(chunk);
        if (error) throw error;
      }
      return payload.length;
    },
    onSuccess: (count) => {
      toast.success(`Imported ${count} transactions`);
      invalidateMoneyViews(qc);
      void qc.invalidateQueries({ queryKey: ["categories"] });
      setOpen(false);
      reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Import transactions
          </DialogTitle>
          <DialogDescription>
            Upload a CSV with columns: <code>date, type, category, amount, note</code>. Dates must be
            YYYY-MM-DD, type must be <code>income</code> or <code>expense</code>. Missing categories
            will be created for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <label
            htmlFor="csv-file"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/70 bg-muted/30 px-4 py-8 text-center transition hover:bg-muted/50"
          >
            <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            <span className="mt-2 text-sm font-medium">Choose CSV file</span>
            <span className="text-xs text-muted-foreground">
              Or drag and drop from your file manager
            </span>
            <input
              ref={fileRef}
              id="csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="sr-only"
            />
          </label>

          {preview.status === "parsed" && (
            <div className="space-y-3">
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>
                  {preview.rows.length} row{preview.rows.length === 1 ? "" : "s"} ready to import
                </AlertTitle>
                <AlertDescription>
                  {preview.unknownCategories.length > 0
                    ? `Will create ${preview.unknownCategories.length} new categor${
                        preview.unknownCategories.length === 1 ? "y" : "ies"
                      }: ${preview.unknownCategories.slice(0, 4).join(", ")}${
                        preview.unknownCategories.length > 4 ? "…" : ""
                      }`
                    : "All categories matched existing ones."}
                </AlertDescription>
              </Alert>

              {preview.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>
                    Skipping {preview.errors.length} invalid row
                    {preview.errors.length === 1 ? "" : "s"}
                  </AlertTitle>
                  <AlertDescription>
                    <ul className="mt-1 max-h-32 list-disc space-y-0.5 overflow-y-auto pl-4 text-xs">
                      {preview.errors.slice(0, 8).map((e) => (
                        <li key={e.line}>
                          Line {e.line}: {e.error}
                        </li>
                      ))}
                      {preview.errors.length > 8 && (
                        <li>…and {preview.errors.length - 8} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => importMut.mutate()}
            disabled={
              importMut.isPending ||
              preview.status !== "parsed" ||
              preview.rows.length === 0
            }
          >
            {importMut.isPending
              ? "Importing…"
              : preview.status === "parsed"
                ? `Import ${preview.rows.length}`
                : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
