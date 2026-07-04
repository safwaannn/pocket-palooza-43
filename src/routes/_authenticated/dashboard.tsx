import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, type ComponentType } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { QuickAddButton } from "@/components/TransactionForm";
import {
  useBudgets,
  useMonthlySpending,
  useTransactions,
  type Transaction,
} from "@/lib/finance-queries";
import { currentMonthYear, formatINR, monthRange, monthYearLabel } from "@/lib/format";
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard - Paisa" }] }),
  component: Dashboard,
});

function Dashboard() {
  const monthYear = currentMonthYear();
  const { start, end } = monthRange(monthYear);
  const { data: monthTransactions = [], isLoading: isMonthLoading } = useTransactions({
    start,
    end,
  });
  const { data: recent = [] } = useTransactions({}, 8);
  const { data: budgets = [] } = useBudgets(monthYear);
  const { data: spent = {} } = useMonthlySpending(monthYear);

  const totals = useMemo(
    () =>
      monthTransactions.reduce(
        (acc, transaction) => {
          acc[transaction.type] += transaction.amount;
          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [monthTransactions],
  );

  const budgetRows = useMemo(
    () =>
      budgets
        .map((budget) => {
          const used = spent[budget.category_id] ?? 0;
          const pct = budget.limit_amount > 0 ? (used / budget.limit_amount) * 100 : 0;
          return {
            id: budget.id,
            name: budget.category?.name ?? "Uncategorized",
            limit: budget.limit_amount,
            spent: used,
            pct,
          };
        })
        .sort((a, b) => b.pct - a.pct),
    [budgets, spent],
  );

  const balance = totals.income - totals.expense;
  const alerts = budgetRows.filter((budget) => budget.pct >= 80);
  const totalBudget = budgetRows.reduce((sum, budget) => sum + budget.limit, 0);
  const budgetSpent = budgetRows.reduce((sum, budget) => sum + budget.spent, 0);

  return (
    <AppShell title="Dashboard">
      <PageHeader
        title={monthYearLabel(monthYear)}
        description="Income, expenses, budgets, and recent activity for the current month."
        actions={<QuickAddButton />}
      />

      {alerts.length > 0 && (
        <Alert className="mb-6 border-warning/40 bg-warning/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Budget alert</AlertTitle>
          <AlertDescription className="space-y-1">
            {alerts.map((budget) => (
              <div key={budget.id}>
                <strong>{budget.name}</strong>{" "}
                {budget.pct >= 100 ? "is over budget" : `has used ${Math.round(budget.pct)}%`} of{" "}
                {formatINR(budget.limit)}.
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Income"
          value={isMonthLoading ? "Loading..." : formatINR(totals.income)}
          icon={TrendingUp}
          tone="success"
        />
        <StatCard
          label="Expenses"
          value={isMonthLoading ? "Loading..." : formatINR(totals.expense)}
          icon={TrendingDown}
          tone="destructive"
        />
        <StatCard
          label="Balance"
          value={isMonthLoading ? "Loading..." : formatINR(balance)}
          icon={Wallet}
          tone={balance >= 0 ? "primary" : "destructive"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Budget status</CardTitle>
              <CardDescription>
                {formatINR(budgetSpent)} spent from {formatINR(totalBudget)} planned.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/budgets">
                Manage <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {budgetRows.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No budgets set for this month. Add limits to unlock alerts.
              </p>
            ) : (
              budgetRows.map((budget) => (
                <div key={budget.id} className="space-y-2">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="font-medium">{budget.name}</span>
                    <span
                      className={
                        budget.pct >= 100
                          ? "text-destructive"
                          : budget.pct >= 80
                            ? "text-warning-foreground"
                            : "text-muted-foreground"
                      }
                    >
                      {formatINR(budget.spent)} / {formatINR(budget.limit)}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, budget.pct)}
                    className={
                      budget.pct >= 100
                        ? "[&>div]:bg-destructive"
                        : budget.pct >= 80
                          ? "[&>div]:bg-warning"
                          : ""
                    }
                  />
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle>Recent transactions</CardTitle>
              <CardDescription>Latest income and expenses across all dates.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/transactions">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((transaction) => (
                  <RecentTransaction key={transaction.id} transaction={transaction} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
  tone: "success" | "destructive" | "primary";
}) {
  const toneCls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-accent/20 text-primary";

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-5 flex items-center justify-between">
          <p className="eyebrow">{label}</p>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${toneCls}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="min-w-0">
          <div className="finance-figure truncate text-4xl font-semibold leading-none">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentTransaction({ transaction }: { transaction: Transaction }) {
  const isIncome = transaction.type === "income";

  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">
          {transaction.category?.name ?? "Uncategorized"}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {transaction.note || transaction.date}
        </div>
      </div>
      <div
        className={`finance-figure whitespace-nowrap text-base font-semibold ${
          isIncome ? "text-success" : "text-destructive"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatINR(transaction.amount)}
      </div>
    </div>
  );
}
