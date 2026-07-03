import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { AppShell } from "@/components/AppShell";
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
import {
  invalidateMoneyViews,
  useCategories,
  useTransactions,
  type Transaction,
} from "@/lib/finance-queries";
import { formatINR } from "@/lib/format";
import { QuickAddButton, TransactionForm } from "@/components/TransactionForm";
import { toast } from "sonner";
import { FilterX, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({ meta: [{ title: "Transactions - Paisa" }] }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [categoryId, setCategoryId] = useState("all");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((category) => type === "all" || category.type === type),
    [categories, type],
  );

  const { data: txns = [], isLoading } = useTransactions({
    type,
    categoryId,
    start: start || undefined,
    end: end || undefined,
    search: search || undefined,
  });

  const totals = useMemo(
    () =>
      txns.reduce(
        (acc, transaction) => {
          acc[transaction.type] += transaction.amount;
          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [txns],
  );
  const balance = totals.income - totals.expense;
  const hasActiveFilters =
    type !== "all" || categoryId !== "all" || Boolean(start) || Boolean(end) || Boolean(search);

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Transaction deleted");
      invalidateMoneyViews(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const clearFilters = () => {
    setType("all");
    setCategoryId("all");
    setStart("");
    setEnd("");
    setSearch("");
  };

  return (
    <AppShell title="Transactions">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Search, filter, add, edit, and delete every money movement.
          </p>
        </div>
        <QuickAddButton />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Income" value={formatINR(totals.income)} tone="success" />
        <SummaryCard label="Expense" value={formatINR(totals.expense)} tone="destructive" />
        <SummaryCard
          label="Net"
          value={formatINR(balance)}
          tone={balance >= 0 ? "success" : "destructive"}
        />
      </div>

      <Card className="mb-6">
        <CardContent
          className="grid grid-cols-1 gap-3 p-4 md:grid-cols-6"
          role="search"
          aria-label="Filter transactions"
        >
          <div className="space-y-2">
            <Label htmlFor="transaction-filter-type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value as typeof type);
                setCategoryId("all");
              }}
            >
              <SelectTrigger
                id="transaction-filter-type"
                aria-describedby="transaction-filter-type-help"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
            <p id="transaction-filter-type-help" className="sr-only">
              Filter transactions by income or expense.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-filter-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger
                id="transaction-filter-category"
                aria-describedby="transaction-filter-category-help"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p id="transaction-filter-category-help" className="sr-only">
              Narrow the list to a single category.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-filter-start">From</Label>
            <Input
              id="transaction-filter-start"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              max={end || undefined}
              aria-describedby="transaction-filter-start-help"
            />
            <p id="transaction-filter-start-help" className="sr-only">
              Earliest transaction date to include.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-filter-end">To</Label>
            <Input
              id="transaction-filter-end"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              min={start || undefined}
              aria-describedby="transaction-filter-end-help"
            />
            <p id="transaction-filter-end-help" className="sr-only">
              Latest transaction date to include.
            </p>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="transaction-filter-search">Search</Label>
            <div className="flex gap-2">
              <Input
                id="transaction-filter-search"
                type="search"
                placeholder="Note, category, or type"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-describedby="transaction-filter-search-help"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                aria-label="Clear all filters"
              >
                <FilterX className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">Clear filters</span>
              </Button>
            </div>
            <p id="transaction-filter-search-help" className="sr-only">
              Matches transaction notes, categories, and types.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{txns.length} transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ListSkeleton rows={6} />
          ) : txns.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters
                ? "No transactions match these filters."
                : "No transactions yet. Add your first income or expense."}
            </p>
          ) : (
            <div className="divide-y">
              {txns.map((transaction) => (
                <TransactionRow
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={() => setEditing(transaction)}
                  onDelete={() => del.mutate(transaction.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editing && (
        <TransactionForm
          initial={editing}
          open={true}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
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

function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isIncome = transaction.type === "income";

  return (
    <div className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium">
            {transaction.category?.name ?? "Uncategorized"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              isIncome ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
            }`}
          >
            {transaction.type}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs text-muted-foreground">
          {transaction.date}
          {transaction.note ? ` - ${transaction.note}` : ""}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div
          className={`whitespace-nowrap text-sm font-semibold ${
            isIncome ? "text-success" : "text-destructive"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatINR(transaction.amount)}
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit transaction</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="ghost">
                <Trash2 className="h-4 w-4" />
                <span className="sr-only">Delete transaction</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete transaction?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the transaction from totals, budgets, and reports.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={onDelete}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
