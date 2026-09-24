import { useQuery, type QueryClient } from "@tanstack/react-query";
import { api, mapCategory } from "@/lib/api";
import type { Category, TransactionType } from "@/lib/finance-queries";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type RecurringTransaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  category: Category | null;
  type: TransactionType;
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  interval_count: number;
  start_date: string;
  next_run: string;
  end_date: string | null;
  active: boolean;
  last_run: string | null;
  created_at: string;
};

type RawRecurring = {
  id?: string;
  _id?: string;
  user?: string;
  category?: { id?: string; _id?: string; name: string; type: TransactionType } | string | null;
  type: TransactionType;
  amount: number;
  note: string | null;
  frequency: RecurringFrequency;
  interval_count: number;
  start_date: string;
  next_run: string;
  end_date: string | null;
  active: boolean;
  last_run: string | null;
  createdAt?: string;
};

const mapRecurring = (r: RawRecurring): RecurringTransaction => {
  const cat = r.category;
  let category: Category | null = null;
  let category_id: string | null = null;
  if (cat && typeof cat === "object") {
    category = mapCategory(cat as never);
    category_id = category.id;
  } else if (typeof cat === "string") {
    category_id = cat;
  }
  return {
    id: r.id ?? r._id ?? "",
    user_id: r.user ?? "",
    category_id,
    category,
    type: r.type,
    amount: Number(r.amount),
    note: r.note ?? null,
    frequency: r.frequency,
    interval_count: r.interval_count,
    start_date: r.start_date,
    next_run: r.next_run,
    end_date: r.end_date ?? null,
    active: r.active,
    last_run: r.last_run ?? null,
    created_at: r.createdAt ?? "",
  };
};

/**
 * Fetch the current user's recurring schedules, active first then by next run.
 */
export const useRecurringTransactions = () =>
  useQuery({
    queryKey: ["recurring-transactions"],
    // Schedules change only when the user explicitly edits them — 5 minutes
    // is well-safe and avoids the rapid refetch loop that caused 429s.
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<RecurringTransaction[]> => {
      const data = await api<RawRecurring[]>(
        "/recurring-transactions?sort=-active,next_run&limit=100",
      );
      return (data ?? []).map(mapRecurring);
    },
  });

export const invalidateRecurring = (qc: QueryClient) => {
  void qc.invalidateQueries({ queryKey: ["recurring-transactions"] });
};

/**
 * Compute the next occurrence date given the current schedule.
 * Moves by whole calendar units, respecting `interval_count`.
 * Returns an ISO date string (YYYY-MM-DD).
 */
export function computeNextRun(
  from: string,
  frequency: RecurringFrequency,
  interval: number,
): string {
  const [y, m, d] = from.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const step = Math.max(1, Math.floor(interval));
  switch (frequency) {
    case "daily":
      date.setUTCDate(date.getUTCDate() + step);
      break;
    case "weekly":
      date.setUTCDate(date.getUTCDate() + step * 7);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + step);
      break;
    case "yearly":
      date.setUTCFullYear(date.getUTCFullYear() + step);
      break;
  }
  return date.toISOString().slice(0, 10);
}

/** Human-readable label like "Every 2 weeks" or "Monthly". */
export function frequencyLabel(frequency: RecurringFrequency, interval: number): string {
  const nouns: Record<RecurringFrequency, [string, string]> = {
    daily: ["day", "days"],
    weekly: ["week", "weeks"],
    monthly: ["month", "months"],
    yearly: ["year", "years"],
  };
  if (interval === 1) {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }
  const [, plural] = nouns[frequency];
  return `Every ${interval} ${plural}`;
}
