import { api } from "@/lib/api";
import { currentMonthYear } from "@/lib/format";

export type FreshAlert = { categoryName: string; threshold: 80 | 100 };

/**
 * Ask the backend to detect any newly-crossed 80%/100% budget thresholds for the
 * current month. The endpoint is idempotent (unique index per threshold) and
 * returns only the freshly-created alerts, which the caller turns into toasts.
 */
export async function detectBudgetAlerts(): Promise<FreshAlert[]> {
  try {
    const fresh = await api<FreshAlert[]>(
      `/budgets/detect-alerts?month_year=${currentMonthYear()}`,
      { method: "POST" },
    );
    return fresh ?? [];
  } catch {
    // Non-fatal — a failed alert check should never block the transaction save.
    return [];
  }
}
