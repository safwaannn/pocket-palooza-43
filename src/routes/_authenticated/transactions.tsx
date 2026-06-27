import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCategories, useTransactions, type Transaction } from "@/lib/finance-queries";
import { formatINR } from "@/lib/format";
import { TransactionForm, QuickAddButton } from "@/components/TransactionForm";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Paisa" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState<string>("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const { data: txns = [], isLoading } = useTransactions({
    type, categoryId, start: start || undefined, end: end || undefined, search: search || undefined,
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <AppShell title="Transactions">
      <div className="flex justify-end mb-4"><QuickAddButton /></div>

      <Card className="mb-6">
        <CardContent className="p-4 grid grid-cols-2 md:grid-cols-5 gap-3">
          <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} placeholder="From" />
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} placeholder="To" />
          <Input placeholder="Search note…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{txns.length} transactions</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : txns.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions match these filters.</p>
          ) : (
            <div className="divide-y">
              {txns.map((t) => {
                const cat = categories.find((c) => c.id === t.category_id);
                return (
                  <div key={t.id} className="flex items-center justify-between py-3 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{cat?.name ?? "Uncategorized"}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${t.type === "income" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}>
                          {t.type}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 truncate">
                        {t.date}{t.note ? ` · ${t.note}` : ""}
                      </div>
                    </div>
                    <div className={`text-sm font-semibold whitespace-nowrap ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : "−"}{formatINR(t.amount)}
                    </div>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(t)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost"><Trash2 className="h-4 w-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => del.mutate(t.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <TransactionForm
          initial={editing}
          open={true}
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </AppShell>
  );
}
