import { computeNextRun, type RecurringTransaction } from "@/lib/recurring-queries";

export type BillOccurrence = {
  id: string;
  scheduleId: string;
  date: string;
  categoryName: string;
  amount: number;
  type: RecurringTransaction["type"];
  note: string | null;
  frequency: RecurringTransaction["frequency"];
  intervalCount: number;
  isPastDue: boolean;
  isDueSoon: boolean;
};

export function addDays(iso: string, count: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  const a = Date.UTC(fromYear, fromMonth - 1, fromDay);
  const b = Date.UTC(toYear, toMonth - 1, toDay);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

export function expandRecurringOccurrences(
  schedules: RecurringTransaction[],
  windowStart: string,
  windowEnd: string,
  todayIso: string,
): BillOccurrence[] {
  const occurrences: BillOccurrence[] = [];

  schedules
    .filter((schedule) => schedule.active)
    .forEach((schedule) => {
      let cursor = schedule.next_run;
      let safety = 0;

      while (cursor < windowStart && safety < 500) {
        cursor = computeNextRun(cursor, schedule.frequency, schedule.interval_count);
        safety++;
      }

      while (cursor <= windowEnd && safety < 500) {
        if (!schedule.end_date || cursor <= schedule.end_date) {
          const daysOut = daysBetween(todayIso, cursor);
          occurrences.push({
            id: `${schedule.id}:${cursor}`,
            scheduleId: schedule.id,
            date: cursor,
            categoryName: schedule.category?.name ?? "Uncategorized",
            amount: schedule.amount,
            type: schedule.type,
            note: schedule.note,
            frequency: schedule.frequency,
            intervalCount: schedule.interval_count,
            isPastDue: daysOut < 0,
            isDueSoon: daysOut >= 0 && daysOut <= 7,
          });
        }

        cursor = computeNextRun(cursor, schedule.frequency, schedule.interval_count);
        safety++;
      }
    });

  return occurrences.sort((a, b) =>
    a.date === b.date ? a.categoryName.localeCompare(b.categoryName) : a.date.localeCompare(b.date),
  );
}
