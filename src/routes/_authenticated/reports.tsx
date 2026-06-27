import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/lib/finance-queries";
import { formatINR } from "@/lib/format";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports — Paisa" }] }),
  component: ReportsPage,
});

const today = () => new Date().toISOString().slice(0, 10);
const monthsAgo = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)", "var(--chart-7)"];

function ReportsPage() {
  const [start, setStart] = useState(monthsAgo(5));
  const [end, setEnd] = useState(today());
  const { data: categories = [] } = useCategories();

  const { data: txns = [] } = useQuery({
    queryKey: ["reports", start, end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount,type,category_id,date")
        .gte("date", start)
        .lte("date", end);
      if (error) throw error;
      return (data ?? []) as { amount: number; type: "income" | "expense"; category_id: string | null; date: string }[];
    },
  });

  const expenseByCat = useMemo(() => {
    const map = new Map<string, number>();
    txns.filter((t) => t.type === "expense").forEach((t) => {
      const key = t.category_id ?? "uncat";
      map.set(key, (map.get(key) ?? 0) + Number(t.amount));
    });
    return Array.from(map.entries()).map(([id, value]) => ({
      name: id === "uncat" ? "Uncategorized" : categories.find((c) => c.id === id)?.name ?? "—",
      value,
    })).sort((a, b) => b.value - a.value);
  }, [txns, categories]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    txns.forEach((t) => {
      const key = t.date.slice(0, 7);
      const row = map.get(key) ?? { month: key, income: 0, expense: 0 };
      row[t.type] += Number(t.amount);
      map.set(key, row);
    });
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [txns]);

  const totalIncome = byMonth.reduce((a, r) => a + r.income, 0);
  const totalExpense = byMonth.reduce((a, r) => a + r.expense, 0);

  return (
    <AppShell title="Reports">
      <Card className="mb-6">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1 w-full md:w-auto">
            <Label>From</Label>
            <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="space-y-2 flex-1 w-full md:w-auto">
            <Label>To</Label>
            <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="flex gap-6 ml-auto">
            <div>
              <div className="text-xs uppercase text-muted-foreground">Income</div>
              <div className="text-lg font-semibold text-success">{formatINR(totalIncome)}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-muted-foreground">Expense</div>
              <div className="text-lg font-semibold text-destructive">{formatINR(totalExpense)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Expense by category</CardTitle></CardHeader>
          <CardContent className="h-80">
            {expenseByCat.length === 0 ? (
              <p className="text-sm text-muted-foreground">No expenses in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expenseByCat} dataKey="value" nameKey="name" outerRadius={100} label={(d) => d.name}>
                    {expenseByCat.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Monthly trend</CardTitle></CardHeader>
          <CardContent className="h-80">
            {byMonth.length === 0 ? (
              <p className="text-sm text-muted-foreground">No data in this range.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Legend />
                  <Bar dataKey="income" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
