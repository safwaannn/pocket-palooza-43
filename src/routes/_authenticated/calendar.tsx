import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  ArrowRight,
  Bell,
  CalendarClock,
  CalendarDays,
  Clock,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CardSkeleton } from "@/components/Skeletons";
import { useCurrency } from "@/hooks/use-currency";
import { useUserRoles } from "@/hooks/use-is-admin";
import {
  addDays,
  daysBetween,
  expandRecurringOccurrences,
  type BillOccurrence,
} from "@/lib/bill-calendar";
import { frequencyLabel, useRecurringTransactions } from "@/lib/recurring-queries";
import { currentMonthYear, formatDate, monthRange, monthYearLabel, today } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Subscription Calendar - Paisa" }] }),
  component: SubscriptionCalendarPage,
});

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function SubscriptionCalendarPage() {
  const { format } = useCurrency();
  const { can } = useUserRoles();
  const canManageSchedules = can("recurring:write");
  const [monthYear, setMonthYear] = useState(currentMonthYear());
  const todayIso = today();
  const { start, end } = monthRange(monthYear);
  const { data: schedules = [], isLoading } = useRecurringTransactions();

  const monthOccurrences = useMemo(
    () => expandRecurringOccurrences(schedules, start, end, todayIso),
    [end, schedules, start, todayIso],
  );
  const upcoming = useMemo(
    () =>
      expandRecurringOccurrences(schedules, todayIso, addDays(todayIso, 60), todayIso).slice(0, 10),
    [schedules, todayIso],
  );
  const byDate = useMemo(() => {
    const map = new Map<string, BillOccurrence[]>();
    monthOccurrences.forEach((occurrence) => {
      map.set(occurrence.date, [...(map.get(occurrence.date) ?? []), occurrence]);
    });
    return map;
  }, [monthOccurrences]);

  const cells = useMemo(() => buildMonthCells(start, end), [end, start]);
  const activeSchedules = schedules.filter((schedule) => schedule.active).length;
  const monthExpense = monthOccurrences
    .filter((occurrence) => occurrence.type === "expense")
    .reduce((sum, occurrence) => sum + occurrence.amount, 0);
  const monthIncome = monthOccurrences
    .filter((occurrence) => occurrence.type === "income")
    .reduce((sum, occurrence) => sum + occurrence.amount, 0);
  const dueSoon = upcoming.filter((occurrence) => occurrence.isDueSoon).length;

  return (
    <AppShell title="Calendar">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Label htmlFor="calendar-month" className="eyebrow">
            Month
          </Label>
          <Input
            id="calendar-month"
            type="month"
            value={monthYear}
            onChange={(event) => event.target.value && setMonthYear(event.target.value)}
            className="w-56"
          />
        </div>
        <Button asChild variant={canManageSchedules ? "default" : "outline"} className="gap-2">
          <Link to="/recurring">
            {canManageSchedules ? "Manage schedules" : "View schedules"}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <SummaryTile
          label="Active schedules"
          value={String(activeSchedules)}
          icon={CalendarClock}
        />
        <SummaryTile label="Due this month" value={String(monthOccurrences.length)} icon={Bell} />
        <SummaryTile
          label="Bills this month"
          value={format(monthExpense)}
          icon={TrendingDown}
          tone="destructive"
        />
        <SummaryTile
          label="Income this month"
          value={format(monthIncome)}
          icon={TrendingUp}
          tone="success"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" /> {monthYearLabel(monthYear)}
            </CardTitle>
            <CardDescription>
              Upcoming rent, subscriptions, EMI, salary, and other recurring money movements.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSkeleton lines={8} />
            ) : (
              <div className="overflow-x-auto">
                <div className="min-w-[760px]">
                  <div className="grid grid-cols-7 border-b border-border/70 text-xs font-medium uppercase text-muted-foreground">
                    {WEEKDAYS.map((day) => (
                      <div key={day} className="px-2 py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7">
                    {cells.map((date, index) => {
                      const events = date ? (byDate.get(date) ?? []) : [];
                      const isToday = date === todayIso;
                      return (
                        <div
                          key={date ?? `empty-${index}`}
                          className={`min-h-32 border-b border-r border-border/60 p-2 ${
                            date ? "bg-card" : "bg-muted/20"
                          } ${isToday ? "ring-2 ring-primary/40 ring-inset" : ""}`}
                        >
                          {date && (
                            <>
                              <div className="mb-2 flex items-center justify-between">
                                <span
                                  className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}
                                >
                                  {Number(date.slice(-2))}
                                </span>
                                {events.length > 2 && (
                                  <Badge variant="outline">{events.length}</Badge>
                                )}
                              </div>
                              <div className="space-y-1.5">
                                {events.slice(0, 3).map((event) => (
                                  <CalendarEvent
                                    key={event.id}
                                    event={event}
                                    format={format}
                                    compact
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Upcoming reminders
            </CardTitle>
            <CardDescription>{dueSoon} due in the next 7 days.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <CardSkeleton lines={6} />
            ) : upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming reminders. Add recurring schedules to populate this calendar.
              </p>
            ) : (
              <div className="space-y-3">
                {upcoming.map((event) => (
                  <CalendarEvent key={event.id} event={event} format={format} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function buildMonthCells(start: string, end: string) {
  const first = new Date(`${start}T00:00:00`);
  const offset = first.getDay();
  const days = Number(end.slice(-2));
  const prefix = Array<string | null>(offset).fill(null);
  const dates = Array.from(
    { length: days },
    (_, index) => `${start.slice(0, 8)}${String(index + 1).padStart(2, "0")}`,
  );
  const cells = [...prefix, ...dates];
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function CalendarEvent({
  event,
  format,
  compact = false,
}: {
  event: BillOccurrence;
  format: (amount: number) => string;
  compact?: boolean;
}) {
  const days = daysBetween(today(), event.date);
  const dueLabel = days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`;
  const isIncome = event.type === "income";

  return (
    <div
      className={`rounded-md border px-2 py-1.5 text-xs ${
        event.isPastDue
          ? "border-destructive/40 bg-destructive/10"
          : event.isDueSoon
            ? "border-warning/40 bg-warning/10"
            : "border-border/70 bg-muted/30"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">{event.categoryName}</div>
          {!compact && (
            <div className="mt-0.5 text-muted-foreground">
              {formatDate(event.date)} - {frequencyLabel(event.frequency, event.intervalCount)}
            </div>
          )}
          {event.note && !compact && (
            <div className="mt-0.5 truncate text-muted-foreground">{event.note}</div>
          )}
        </div>
        <div className={`shrink-0 font-semibold ${isIncome ? "text-success" : "text-destructive"}`}>
          {isIncome ? "+" : "-"}
          {format(event.amount)}
        </div>
      </div>
      {!compact && (
        <Badge
          variant={event.isPastDue ? "destructive" : event.isDueSoon ? "secondary" : "outline"}
          className="mt-2"
        >
          {dueLabel}
        </Badge>
      )}
    </div>
  );
}

function SummaryTile({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
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
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="eyebrow">{label}</div>
          <div className={`finance-figure mt-1 truncate text-2xl font-semibold ${valueClass}`}>
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
