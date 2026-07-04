import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/AppShell";
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
import { currentMonthYear, formatINR, monthRange, monthYearLabel, monthsAgo } from "@/lib/format";
import { AlertTriangle, ArrowRight, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { StatCardGridSkeleton, BudgetListSkeleton, ListSkeleton, ChartSkeleton } from "@/components/Skeletons";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
];

const currencyTooltip = (value: unknown, name: unknown) => [
  formatINR(Number(value)),
  String(name ?? ""),
];
const compactINR = (n: number) =>
  new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
const shortMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "short" });
};
const fullMonth = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

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
  const { data: recent = [], isLoading: isRecentLoading } = useTransactions({}, 8);
  const { data: budgets = [], isLoading: isBudgetsLoading } = useBudgets(monthYear);
  const { data: spent = {} } = useMonthlySpending(monthYear);
  const { data: trendTxns = [], isLoading: isTrendLoading } = useTransactions({
    start: monthsAgo(5),
    end,
  });

  const trendByMonth = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number }>();
    // Seed last 6 months so gaps still render
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(key, { month: key, income: 0, expense: 0 });
    }
    trendTxns.forEach((t) => {
      const key = t.date.slice(0, 7);
      const row = map.get(key);
      if (row) row[t.type] += t.amount;
    });
    return Array.from(map.values()).map((r) => ({ ...r, label: shortMonth(r.month) }));
  }, [trendTxns]);

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const key = t.category?.name ?? "Uncategorized";
        map.set(key, (map.get(key) ?? 0) + t.amount);
      });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);
  }, [monthTransactions]);

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{monthYearLabel(monthYear)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Income, expenses, budgets, and recent activity for the current month.
          </p>
        </div>
        <QuickAddButton />
      </div>

      {alerts.length > 0 && (
        <Alert
          className="mb-6 border-warning/40 bg-warning/10"
          role={alerts.some((b) => b.pct >= 100) ? "alert" : "status"}
          aria-live={alerts.some((b) => b.pct >= 100) ? "assertive" : "polite"}
          aria-atomic="true"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
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

      {isMonthLoading ? (
        <StatCardGridSkeleton count={3} />
      ) : (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard label="Income" value={formatINR(totals.income)} icon={TrendingUp} tone="success" />
          <StatCard label="Expenses" value={formatINR(totals.expense)} icon={TrendingDown} tone="destructive" />
          <StatCard label="Balance" value={formatINR(balance)} icon={Wallet} tone={balance >= 0 ? "primary" : "destructive"} />
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Income vs Expenses</CardTitle>
            <CardDescription>Last 6 months of activity.</CardDescription>
          </CardHeader>
          <CardContent>
            {isTrendLoading ? (
              <ChartSkeleton height={280} />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={trendByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/60" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(v) => compactINR(Number(v))}
                    width={60}
                  />
                  <Tooltip
                    formatter={currencyTooltip}
                    contentStyle={{
                      background: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses by category</CardTitle>
            <CardDescription>Breakdown for {monthYearLabel(monthYear)}.</CardDescription>
          </CardHeader>
          <CardContent>
            {isMonthLoading ? (
              <ChartSkeleton height={280} />
            ) : expenseByCategory.length === 0 ? (
              <p className="flex h-[280px] items-center justify-center text-sm text-muted-foreground">
                No expenses recorded this month.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Tooltip formatter={currencyTooltip} />
                  <Pie
                    data={expenseByCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {expenseByCategory.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
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
            {isBudgetsLoading ? (
              <BudgetListSkeleton rows={3} />
            ) : null}
            {!isBudgetsLoading && budgetRows.length === 0 ? (
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
            {isRecentLoading ? (
              <ListSkeleton rows={5} />
            ) : recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No transactions yet.</p>
            ) : (
              <div className="divide-y">
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
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "destructive" | "primary";
}) {
  const toneCls =
    tone === "success"
      ? "bg-success/10 text-success"
      : tone === "destructive"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-primary";

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="text-xs uppercase text-muted-foreground">{label}</div>
          <div className="mt-0.5 truncate text-2xl font-semibold">{value}</div>
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
        <div className="truncate text-sm font-medium">
          {transaction.category?.name ?? "Uncategorized"}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {transaction.note || transaction.date}
        </div>
      </div>
      <div
        className={`whitespace-nowrap text-sm font-semibold ${
          isIncome ? "text-success" : "text-destructive"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatINR(transaction.amount)}
      </div>
    </div>
  );
}
