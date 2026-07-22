import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarClock, Lock, Pause, Play, Plus, Trash2 } from "lucide-react";

import { useCategories, type TransactionType } from "@/lib/finance-queries";
import {
  computeNextRun,
  frequencyLabel,
  invalidateRecurring,
  useRecurringTransactions,
  type RecurringFrequency,
} from "@/lib/recurring-queries";
import { useCurrency } from "@/hooks/use-currency";
import { formatDate, today } from "@/lib/format";
import { useUserRoles } from "@/hooks/use-is-admin";
import { ReadOnlyNotice } from "@/components/ReadOnlyNotice";

export const Route = createFileRoute("/_authenticated/recurring")({
  head: () => ({ meta: [{ title: "Recurring — Paisa" }] }),
  component: RecurringPage,
});

function RecurringPage() {
  const qc = useQueryClient();
  const { format } = useCurrency();
  const { can } = useUserRoles();
  const canWrite = can("recurring:write");
  const { data: recurring = [], isLoading } = useRecurringTransactions();
  const [open, setOpen] = useState(false);

  const toggleActive = useMutation({
    mutationFn: async ({ id, next }: { id: string; next: boolean }) => {
      if (!canWrite) throw new Error("Your role can view schedules but cannot change them");
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ active: next })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => invalidateRecurring(qc),
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      if (!canWrite) throw new Error("Your role can view schedules but cannot delete them");
      const { error } = await supabase.from("recurring_transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Schedule removed");
      invalidateRecurring(qc);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totals = useMemo(() => {
    const active = recurring.filter((r) => r.active);
    const monthly = active.reduce((sum, r) => {
      // Rough monthly-equivalent for a summary card.
      const perMonth =
        r.frequency === "daily"
          ? (r.amount * 30) / r.interval_count
          : r.frequency === "weekly"
            ? (r.amount * 4.33) / r.interval_count
            : r.frequency === "monthly"
              ? r.amount / r.interval_count
              : r.amount / (12 * r.interval_count);
      const signed = r.type === "expense" ? -perMonth : perMonth;
      return sum + signed;
    }, 0);
    return { activeCount: active.length, monthly };
  }, [recurring]);

  return (
    <AppShell title="Recurring">
      {!canWrite && (
        <ReadOnlyNotice description="You can review recurring income and bills, but creating, pausing, and deleting schedules are disabled." />
      )}

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Schedules that auto-post transactions on their due date (rent, subscriptions, salary…).
          </p>
        </div>
        {canWrite ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> New schedule
              </Button>
            </DialogTrigger>
            <RecurringDialog onClose={() => setOpen(false)} />
          </Dialog>
        ) : (
          <Button disabled variant="outline" className="gap-2">
            <Lock className="h-4 w-4" /> New schedule
          </Button>
        )}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <div className="eyebrow">Active schedules</div>
            <div className="finance-figure mt-2 text-3xl font-semibold">
              {totals.activeCount}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="eyebrow">Monthly net impact</div>
            <div
              className={`finance-figure mt-2 text-3xl font-semibold ${
                totals.monthly >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {totals.monthly >= 0 ? "+" : "-"}
              {format(Math.abs(totals.monthly))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" /> {recurring.length} schedule
            {recurring.length === 1 ? "" : "s"}
          </CardTitle>
          <CardDescription>
            Paused schedules stay in the list but won't post transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : recurring.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No recurring schedules yet. Add one for anything that repeats on a regular cadence.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {recurring.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold truncate">
                        {r.category?.name ?? "Uncategorized"}
                      </span>
                      <Badge variant={r.type === "income" ? "secondary" : "outline"}>
                        {r.type}
                      </Badge>
                      <Badge variant="outline">
                        {frequencyLabel(r.frequency, r.interval_count)}
                      </Badge>
                      {!r.active && <Badge variant="secondary">Paused</Badge>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      Next run {formatDate(r.next_run)}
                      {r.note ? ` · ${r.note}` : ""}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div
                      className={`finance-figure whitespace-nowrap text-base font-semibold ${
                        r.type === "income" ? "text-success" : "text-destructive"
                      }`}
                    >
                      {r.type === "income" ? "+" : "-"}
                      {format(r.amount)}
                    </div>
                    {canWrite && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleActive.mutate({ id: r.id, next: !r.active })}
                          aria-label={r.active ? "Pause schedule" : "Resume schedule"}
                        >
                          {r.active ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" aria-label="Delete schedule">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this schedule?</AlertDialogTitle>
                              <AlertDialogDescription>
                                The template will be removed but past transactions it created stay put.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => del.mutate(r.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function RecurringDialog({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [intervalCount, setIntervalCount] = useState("1");
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");

  const filteredCats = categories.filter((c) => c.type === type);

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const interval = Math.max(1, Number(intervalCount) || 1);
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) throw new Error("Enter a valid amount");
      if (!categoryId) throw new Error("Pick a category");
      if (endDate && endDate < startDate) throw new Error("End date is before start date");

      const { error } = await supabase.from("recurring_transactions").insert({
        user_id: userData.user.id,
        category_id: categoryId,
        type,
        amount: amt,
        note: note.trim() || null,
        frequency,
        interval_count: interval,
        start_date: startDate,
        next_run: startDate, // First run is on start_date; materializer picks it up if <= today.
        end_date: endDate || null,
        active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Schedule created");
      invalidateRecurring(qc);
      onClose();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Show a preview of the next 3 occurrences.
  const preview = useMemo(() => {
    const interval = Math.max(1, Number(intervalCount) || 1);
    const dates: string[] = [];
    let cursor = startDate;
    for (let i = 0; i < 3; i++) {
      dates.push(cursor);
      cursor = computeNextRun(cursor, frequency, interval);
      if (endDate && cursor > endDate) break;
    }
    return dates;
  }, [startDate, frequency, intervalCount, endDate]);

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5" /> New recurring schedule
        </DialogTitle>
        <DialogDescription>
          Auto-post an income or expense transaction on a recurring cadence.
        </DialogDescription>
      </DialogHeader>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rec-type">Type</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                setType(v as TransactionType);
                setCategoryId("");
              }}
            >
              <SelectTrigger id="rec-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-amount">Amount</Label>
            <Input
              id="rec-amount"
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rec-category">Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="rec-category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {filteredCats.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
              {filteredCats.length === 0 && (
                <div className="px-2 py-2 text-sm text-muted-foreground">
                  Add a {type} category first.
                </div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rec-frequency">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as RecurringFrequency)}
            >
              <SelectTrigger id="rec-frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-interval">Every N</Label>
            <Input
              id="rec-interval"
              type="number"
              min="1"
              max="365"
              value={intervalCount}
              onChange={(e) => setIntervalCount(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="rec-start">Start date</Label>
            <Input
              id="rec-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rec-end">End date (optional)</Label>
            <Input
              id="rec-end"
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rec-note">Note</Label>
          <Textarea
            id="rec-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional"
            maxLength={255}
          />
        </div>

        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 text-xs">
          <div className="mb-1 font-medium">Next occurrences</div>
          <div className="text-muted-foreground">
            {preview.map((d) => formatDate(d)).join("  →  ")}
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={create.isPending}>
          {create.isPending ? "Saving…" : "Create schedule"}
        </Button>
      </form>
    </DialogContent>
  );
}
