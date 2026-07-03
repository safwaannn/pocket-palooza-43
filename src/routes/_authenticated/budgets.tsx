import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetListSkeleton } from "@/components/Skeletons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  invalidateMoneyViews,
  useBudgets,
  useCategories,
  useMonthlySpending,
} from "@/lib/finance-queries";
import { currentMonthYear, formatINR, monthYearLabel } from "@/lib/format";
import { toast } from "sonner";
import { AlertTriangle, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/budgets")({
  head: () => ({ meta: [{ title: "Budgets - Paisa" }] }),
  component: BudgetsPage,
});

function BudgetsPage() {
  const qc = useQueryClient();
  const [monthYear, setMonthYear] = useState(currentMonthYear());
  const { data: categories = [] } = useCategories();
  const { data: budgets = [], isLoading } = useBudgets(monthYear);
  const { data: spent = {} } = useMonthlySpending(monthYear);
  const expenseCats = categories.filter((category) => category.type === "expense");

  const [categoryId, setCategoryId] = useState("");
  const [limit, setLimit] = useState("");
  const existingBudget = budgets.find((budget) => budget.category_id === categoryId);

  useEffect(() => {
    if (!categoryId) {
      setLimit("");
      return;
    }
    const budget = budgets.find((item) => item.category_id === categoryId);
    setLimit(budget ? String(budget.limit_amount) : "");
  }, [budgets, categoryId]);

  const budgetRows = useMemo(
    () =>
      budgets
        .map((budget) => {
          const used = spent[budget.category_id] ?? 0;
          const pct = budget.limit_amount > 0 ? (used / budget.limit_amount) * 100 : 0;
          return {
            ...budget,
            used,
            pct,
            remaining: budget.limit_amount - used,
            name: budget.category?.name ?? "Uncategorized",
          };
        })
        .sort((a, b) => b.pct - a.pct),
    [budgets, spent],
  );

  const totalLimit = budgetRows.reduce((total, budget) => total + budget.limit_amount, 0);
  const totalSpent = budgetRows.reduce((total, budget) => total + budget.used, 0);
  const totalRemaining = totalLimit - totalSpent;
  const alerts = budgetRows.filter((budget) => budget.pct >= 80);

  const upsert = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { error } = await supabase.from("budgets").upsert(
        {
          user_id: userData.user.id,
          category_id: categoryId,
          month_year: monthYear,
          limit_amount: Number(limit),
        },
        { onConflict: "user_id,category_id,month_year" },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(existingBudget ? "Budget updated" : "Budget saved");
      setCategoryId("");
      invalidateMoneyViews(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Budget removed");
      invalidateMoneyViews(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <AppShell title="Budgets">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget-month" className="text-xs uppercase text-muted-foreground">
            Month
          </Label>
          <Input
            id="budget-month"
            type="month"
            value={monthYear}
            onChange={(event) => {
              if (!event.target.value) return;
              setMonthYear(event.target.value);
              setCategoryId("");
            }}
            className="w-56"
            aria-describedby="budget-month-help"
          />
          <p id="budget-month-help" className="sr-only">
            Choose which month's budgets to view or edit.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">{monthYearLabel(monthYear)}</div>
      </div>

      {alerts.length > 0 && (
        <Alert
          className="mb-6 border-warning/40 bg-warning/10"
          role={alerts.some((b) => b.pct >= 100) ? "alert" : "status"}
          aria-live={alerts.some((b) => b.pct >= 100) ? "assertive" : "polite"}
          aria-atomic="true"
        >
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Budget attention needed</AlertTitle>
          <AlertDescription className="space-y-1">
            {alerts.map((budget) => (
              <div key={budget.id}>
                <strong>{budget.name}</strong> is{" "}
                {budget.pct >= 100 ? "over budget" : `${Math.round(budget.pct)}% used`}.
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Planned" value={formatINR(totalLimit)} />
        <SummaryCard label="Spent" value={formatINR(totalSpent)} tone="destructive" />
        <SummaryCard
          label={totalRemaining >= 0 ? "Remaining" : "Over budget"}
          value={formatINR(Math.abs(totalRemaining))}
          tone={totalRemaining >= 0 ? "success" : "destructive"}
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Set monthly limit</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 md:flex-row"
            aria-label="Set monthly budget limit"
            onSubmit={(event) => {
              event.preventDefault();
              if (!categoryId) return toast.error("Pick a category");
              if (!limit || Number(limit) <= 0) return toast.error("Enter a valid limit");
              upsert.mutate();
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="budget-category">Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger
                  id="budget-category"
                  aria-required="true"
                  aria-describedby="budget-category-help"
                >
                  <SelectValue placeholder="Select expense category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCats.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p id="budget-category-help" className="text-xs text-muted-foreground">
                Only expense categories can have budgets.
              </p>
            </div>
            <div className="space-y-2 md:w-52">
              <Label htmlFor="budget-limit">Monthly limit (INR)</Label>
              <Input
                id="budget-limit"
                type="number"
                min="0"
                step="1"
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                required
                aria-required="true"
                aria-describedby="budget-limit-help"
                inputMode="numeric"
              />
              <p id="budget-limit-help" className="text-xs text-muted-foreground">
                Alerts fire at 80% and 100% of this limit.
              </p>
            </div>
            <Button type="submit" className="md:self-end" disabled={upsert.isPending}>
              {upsert.isPending ? "Saving..." : existingBudget ? "Update budget" : "Save budget"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{monthYearLabel(monthYear)} budgets</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <BudgetListSkeleton rows={4} />
          ) : budgetRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No budgets for this month. Add limits for your expense categories.
            </p>
          ) : (
            budgetRows.map((budget) => (
              <div key={budget.id} className="space-y-2">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <div className="font-medium">{budget.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {budget.remaining >= 0
                        ? `${formatINR(budget.remaining)} remaining`
                        : `${formatINR(Math.abs(budget.remaining))} over`}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <span
                      className={`text-sm ${
                        budget.pct >= 100
                          ? "text-destructive"
                          : budget.pct >= 80
                            ? "text-warning-foreground"
                            : "text-muted-foreground"
                      }`}
                    >
                      {formatINR(budget.used)} / {formatINR(budget.limit_amount)} (
                      {Math.round(budget.pct)}%)
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Remove {budget.name} budget</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove budget?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This removes the monthly limit for {budget.name}. Transactions are not
                            deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => del.mutate(budget.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
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
    </AppShell>
  );
}

function SummaryCard({
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
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase text-muted-foreground">{label}</div>
        <div className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
