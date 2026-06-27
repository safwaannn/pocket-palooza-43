import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useCategories, useBudgets } from "@/lib/finance-queries";
import { currentMonthYear, formatINR, monthYearLabel, monthRange } from "@/lib/format";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Budgets — Paisa" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const qc = useQueryClient();
  const [my, setMy] = useState(currentMonthYear());
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets(my);
  const expenseCats = categories.filter((c) => c.type === "expense");

  const { start, end } = monthRange(my);
  const { data: spent = {} } = useQuery({
    queryKey: ["spent-by-cat", my],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("category_id,amount")
        .eq("type", "expense")
        .gte("date", start)
        .lte("date", end);
      if (error) throw error;
      const out: Record<string, number> = {};
      (data ?? []).forEach((r) => {
        if (!r.category_id) return;
        out[r.category_id] = (out[r.category_id] ?? 0) + Number(r.amount);
      });
      return out;
    },
  });

  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");

  const upsert = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("budgets").upsert(
        { user_id: u.user.id, category_id: categoryId, month_year: my, limit_amount: Number(limit) },
        { onConflict: "user_id,category_id,month_year" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Budget saved");
      setLimit("");
      setCategoryId("");
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["budgets"] });
    },
  });

  const months: string[] = (() => {
    const out: string[] = [];
    const now = new Date();
    for (let i = -2; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return out;
  })();

  return (
    <AppShell title="Budgets">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div className="space-y-1">
          <Label className="text-xs uppercase tracking-wide text-muted-foreground">Month</Label>
          <Select value={my} onValueChange={setMy}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              {months.map((m) => <SelectItem key={m} value={m}>{monthYearLabel(m)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Set or update budget</CardTitle></CardHeader>
        <CardContent>
          <form
            className="flex flex-col md:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!categoryId) return toast.error("Pick a category");
              if (!limit || Number(limit) <= 0) return toast.error("Enter a valid limit");
              upsert.mutate();
            }}
          >
            <div className="flex-1 space-y-2">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger><SelectValue placeholder="Select expense category" /></SelectTrigger>
                <SelectContent>
                  {expenseCats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:w-48 space-y-2">
              <Label>Monthly limit (₹)</Label>
              <Input type="number" min="0" step="1" value={limit} onChange={(e) => setLimit(e.target.value)} />
            </div>
            <Button type="submit" className="md:self-end" disabled={upsert.isPending}>Save</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>{monthYearLabel(my)} budgets</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {budgets.length === 0 && <p className="text-sm text-muted-foreground">No budgets for this month.</p>}
          {budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.category_id);
            const used = spent[b.category_id] ?? 0;
            const pct = (used / b.limit_amount) * 100;
            return (
              <div key={b.id}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="font-medium">{cat?.name ?? "—"}</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm ${pct >= 100 ? "text-destructive" : pct >= 80 ? "text-warning-foreground" : "text-muted-foreground"}`}>
                      {formatINR(used)} / {formatINR(b.limit_amount)} ({Math.round(pct)}%)
                    </span>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <Progress
                  value={Math.min(100, pct)}
                  className={pct >= 100 ? "[&>div]:bg-destructive" : pct >= 80 ? "[&>div]:bg-warning" : ""}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </AppShell>
  );
}
