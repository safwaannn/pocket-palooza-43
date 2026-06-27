import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatINR, currentMonthYear, monthRange, monthYearLabel } from "@/lib/format";
import { useCategories, useBudgets, useTransactions } from "@/lib/finance-queries";
import { QuickAddButton } from "@/components/TransactionForm";
import { TrendingUp, TrendingDown, Wallet, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Paisa" }] }),
  component: Dashboard,
});

function Dashboard() {
  const my = currentMonthYear();
  const { start, end } = monthRange(my);

  const monthQuery = useQuery({
    queryKey: ["dashboard", "month", my],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("amount,type,category_id")
        .gte("date", start)
        .lte("date", end);
      if (error) throw error;
      return data as { amount: string; type: "income" | "expense"; category_id: string | null }[];
    },
  });
  const { data: categories = [] } = useCategories();
  const { data: budgets = [] } = useBudgets(my);
  const { data: recent = [] } = useTransactions({});

  const rows = monthQuery.data ?? [];
  const income = rows.filter((r) => r.type === "income").reduce((a, r) => a + Number(r.amount), 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((a, r) => a + Number(r.amount), 0);
  const balance = income - expense;

  const spentByCat = new Map<string, number>();
  rows.filter((r) => r.type === "expense" && r.category_id).forEach((r) => {
    spentByCat.set(r.category_id!, (spentByCat.get(r.category_id!) ?? 0) + Number(r.amount));
  });

  const budgetRows = budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.category_id);
    const spent = spentByCat.get(b.category_id) ?? 0;
    const pct = Math.min(200, (spent / b.limit_amount) * 100);
    return { id: b.id, name: cat?.name ?? "—", limit: b.limit_amount, spent, pct };
  });

  const alerts = budgetRows.filter((b) => b.pct >= 80);

  return (
    <AppShell title="Dashboard">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">{monthYearLabel(my)}</p>
        <QuickAddButton />
      </div>

      {alerts.length > 0 && (
        <Alert className="mb-6 border-warning/40 bg-warning/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget alert</AlertTitle>
          <AlertDescription>
            {alerts.map((a) => (
              <div key={a.id}>
                <strong>{a.name}</strong> — {a.pct >= 100 ? "exceeded" : "used " + Math.round(a.pct) + "%"} of {formatINR(a.limit)}
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Income" value={formatINR(income)} icon={TrendingUp} tone="success" />
        <StatCard label="Expenses" value={formatINR(expense)} icon={TrendingDown} tone="destructive" />
        <StatCard label="Balance" value={formatINR(balance)} icon={Wallet} tone={balance >= 0 ? "primary" : "destructive"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Budget status</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {budgetRows.length === 0 && (
              <p className="text-sm text-muted-foreground">No budgets set yet. Head to Budgets to add one.</p>
            )}
            {budgetRows.map((b) => (
              <div key={b.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium">{b.name}</span>
                  <span className={b.pct >= 100 ? "text-destructive" : b.pct >= 80 ? "text-warning-foreground" : "text-muted-foreground"}>
                    {formatINR(b.spent)} / {formatINR(b.limit)}
                  </span>
                </div>
                <Progress value={Math.min(100, b.pct)} className={b.pct >= 100 ? "[&>div]:bg-destructive" : b.pct >= 80 ? "[&>div]:bg-warning" : ""} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent transactions</CardTitle></CardHeader>
          <CardContent className="space-y-1">
            {recent.slice(0, 8).map((t) => {
              const cat = categories.find((c) => c.id === t.category_id);
              return (
                <div key={t.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="text-sm font-medium">{cat?.name ?? "Uncategorized"}</div>
                    <div className="text-xs text-muted-foreground">{t.note || t.date}</div>
                  </div>
                  <div className={`text-sm font-semibold ${t.type === "income" ? "text-success" : "text-destructive"}`}>
                    {t.type === "income" ? "+" : "−"}{formatINR(t.amount)}
                  </div>
                </div>
              );
            })}
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No transactions yet.</p>}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({
  label, value, icon: Icon, tone,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "destructive" | "primary";
}) {
  const toneCls = tone === "success" ? "bg-success/10 text-success" : tone === "destructive" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary";
  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{label}</div>
          <div className="text-2xl font-semibold mt-0.5">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}
