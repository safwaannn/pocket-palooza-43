import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { useTransactions } from "@/lib/finance-queries";
import { formatINR } from "@/lib/format";
import { Sparkles, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/insights")({
  head: () => ({ meta: [{ title: "Insights — Paisa" }] }),
  component: InsightsPage,
});

function InsightsPage() {
  const { data: txns = [], isLoading } = useTransactions();

  if (isLoading) {
    return (
      <AppShell title="Insights">
        <p className="text-muted-foreground">Loading insights…</p>
      </AppShell>
    );
  }

  if (txns.length === 0) {
    return (
      <AppShell title="Insights">
        <EmptyState
          icon={Sparkles}
          title="Nothing to analyze yet"
          description="Add a few transactions and Paisa will surface patterns here."
        />
      </AppShell>
    );
  }

  const expenses = txns.filter((t) => t.type === "expense");
  const income = txns.filter((t) => t.type === "income");

  const totalExpense = expenses.reduce((s, t) => s + t.amount, 0);
  const totalIncome = income.reduce((s, t) => s + t.amount, 0);
  const avgExpense = expenses.length ? totalExpense / expenses.length : 0;
  const biggest = expenses.reduce<typeof expenses[number] | null>(
    (max, t) => (!max || t.amount > max.amount ? t : max),
    null,
  );

  // Top categories
  const byCat: Record<string, { name: string; total: number; count: number }> = {};
  expenses.forEach((t) => {
    const key = t.category?.id ?? "uncat";
    const name = t.category?.name ?? "Uncategorised";
    byCat[key] = byCat[key] ?? { name, total: 0, count: 0 };
    byCat[key].total += t.amount;
    byCat[key].count += 1;
  });
  const topCats = Object.values(byCat).sort((a, b) => b.total - a.total).slice(0, 5);

  // Day-of-week pattern
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const byDow: Record<string, number> = {};
  expenses.forEach((t) => {
    const d = new Date(t.date).getDay();
    byDow[dow[d]] = (byDow[dow[d]] ?? 0) + t.amount;
  });
  const heaviestDay = Object.entries(byDow).sort((a, b) => b[1] - a[1])[0];

  const savingsRate = totalIncome ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;

  return (
    <AppShell title="Insights">
      <PageHeader
        title="Money insights"
        description="Patterns we noticed in your spending."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard label="Avg expense" value={formatINR(avgExpense)} icon={TrendingDown} />
        <StatCard
          label="Savings rate"
          value={`${savingsRate.toFixed(0)}%`}
          icon={TrendingUp}
          tone={savingsRate >= 20 ? "success" : "warning"}
        />
        <StatCard
          label="Biggest expense"
          value={biggest ? formatINR(biggest.amount) : "—"}
          icon={TrendingDown}
          hint={biggest?.category?.name}
          tone="destructive"
        />
        <StatCard
          label="Heaviest day"
          value={heaviestDay ? heaviestDay[0] : "—"}
          icon={Calendar}
          hint={heaviestDay ? formatINR(heaviestDay[1]) : undefined}
        />
      </div>

      <Card>
        <CardHeader><CardTitle>Top categories</CardTitle></CardHeader>
        <CardContent>
          <ul className="divide-y">
            {topCats.map((c) => (
              <li key={c.name} className="py-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.count} transactions</p>
                </div>
                <p className="font-semibold">{formatINR(c.total)}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AppShell>
  );
}
