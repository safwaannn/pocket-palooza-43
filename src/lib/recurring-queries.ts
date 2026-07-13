import { useQuery, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
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

type Row = Omit<RecurringTransaction, "amount" | "category"> & {
  amount: number | string;
  categories?: Category | null;
};

export const useRecurringTransactions = () =>
  useQuery({
    queryKey: ["recurring-transactions"],
    queryFn: async (): Promise<RecurringTransaction[]> => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .select("*, categories(id,user_id,name,type)")
        .order("active", { ascending: false })
        .order("next_run", { ascending: true });
      if (error) throw error;
      return ((data ?? []) as Row[]).map((r) => ({
        ...r,
        amount: Number(r.amount),
        category: r.categories ?? null,
        frequency: r.frequency as RecurringFrequency,
      }));
    },
  });

export const invalidateRecurring = (qc: QueryClient) => {
  void qc.invalidateQueries({ queryKey: ["recurring-transactions"] });
};

/**
 * Compute the next occurrence date given the current schedule.
 * We move by whole calendar units (day / week / month / year), respecting `interval_count`.
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
