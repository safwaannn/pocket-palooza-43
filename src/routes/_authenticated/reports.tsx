import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTransactions } from "@/lib/finance-queries";
import { formatINR, monthsAgo } from "@/lib/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({ meta: [{ title: "Reports - Paisa" }] }),
  component: ReportsPage,
});

const today = () => new Date().toISOString().slice(0, 10);

const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
];

const currencyTooltip = (value: unknown) => formatINR(Number(value));

function ReportsPage() {
  const [start, setStart] = useState(monthsAgo(5));
  const [end, setEnd] = useState(today());
  const { data: txns = [], isLoading } = useTransactions({ start, end });

  const expenseByCat = useMemo(() => {
    const map = new Map<string, number>();
    txns
      .filter((transaction) => transaction.type === "expense")
      .forEach((transaction) => {
        const key = transaction.category?.name ?? "Uncategorized";
        map.set(key, (map.get(key) ?? 0) + transaction.amount);
      });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [txns]);

  const byMonth = useMemo(() => {
    const map = new Map<string, { month: string; income: number; expense: number; net: number }>();

    txns.forEach((transaction) => {
      const key = transaction.date.slice(0, 7);
      const row = map.get(key) ?? { month: key, income: 0, expense: 0, net: 0 };
      row[transaction.type] += transaction.amount;
      row.net = row.income - row.expense;
      map.set(key, row);
    });

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [txns]);

  const totalIncome = txns
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const totalExpense = txns
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const net = totalIncome - totalExpense;
  const topExpense = expenseByCat[0];

  return (
    <AppShell title="Reports">
      <Card className="mb-6">
        <CardContent className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] lg:items-end">
          <div className="space-y-2">
            <Label htmlFor="report-start">From</Label>
            <Input
              id="report-start"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-end">To</Label>
            <Input
              id="report-end"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
            />
          </div>
          <div className="grid grid-cols-3 gap-4 rounded-lg border bg-muted/30 p-3">
            <MiniMetric label="Income" value={formatINR(totalIncome)} tone="success" />
            <MiniMetric label="Expense" value={formatINR(totalExpense)} tone="destructive" />
            <MiniMetric
              label="Net"
              value={formatINR(net)}
              tone={net >= 0 ? "success" : "destructive"}
            />
          </div>
        </CardContent>
      </Card>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Transactions" value={isLoading ? "Loading..." : String(txns.length)} />
        <SummaryCard
          label="Top expense"
          value={topExpense ? topExpense.name : "None"}
          detail={topExpense ? formatINR(topExpense.value) : "No expense data"}
        />
        <SummaryCard
          label="Monthly average"
          value={formatINR(byMonth.length ? totalExpense / byMonth.length : 0)}
          detail="Expense across active months"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Expense by category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {expenseByCat.length === 0 ? (
                <EmptyChart label="No expenses in this range." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCat}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={100}
                      label={(entry) => entry.name}
                    >
                      {expenseByCat.map((entry, index) => (
                        <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={currencyTooltip} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {expenseByCat.length > 0 && (
              <div className="mt-4 divide-y">
                {expenseByCat.slice(0, 6).map((row) => (
                  <div key={row.name} className="flex items-center justify-between py-2 text-sm">
                    <span className="truncate">{row.name}</span>
                    <span className="font-medium">{formatINR(row.value)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly trend</CardTitle>
          </CardHeader>
          <CardContent>
            {byMonth.length === 0 ? (
              <div className="h-80">
                <EmptyChart label="No data in this range." />
              </div>
            ) : (
              <Tabs defaultValue="bar">
                <TabsList className="mb-4">
                  <TabsTrigger value="bar">Bar</TabsTrigger>
                  <TabsTrigger value="line">Line</TabsTrigger>
                </TabsList>
                <TabsContent value="bar" className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={byMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                      <Tooltip formatter={currencyTooltip} />
                      <Legend />
                      <Bar dataKey="income" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                      <Bar dataKey="expense" fill="var(--chart-3)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </TabsContent>
                <TabsContent value="line" className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={byMonth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                      <Tooltip formatter={currencyTooltip} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="income"
                        stroke="var(--chart-1)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="expense"
                        stroke="var(--chart-3)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="net"
                        stroke="var(--chart-4)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function MiniMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "success" | "destructive";
}) {
  const valueClass =
    tone === "success"
      ? "text-success"
      : tone === "destructive"
        ? "text-destructive"
        : "text-foreground";

  return (
    <div className="min-w-0">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`truncate text-lg font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className="mt-1 truncate text-2xl font-semibold">{value}</div>
        {detail && <div className="mt-1 text-sm text-muted-foreground">{detail}</div>}
      </CardContent>
    </Card>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
