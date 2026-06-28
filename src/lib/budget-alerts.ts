import { supabase } from "@/integrations/supabase/client";
import { currentMonthYear, monthRange } from "@/lib/format";

/**
 * After a transaction mutation, check current-month spending for every budget,
 * and insert any newly-crossed 80% or 100% threshold rows. Unique constraint
 * prevents duplicates, so we can blindly upsert with ignoreDuplicates.
 */
export type FreshAlert = { categoryName: string; threshold: 80 | 100 };

export async function detectBudgetAlerts(): Promise<FreshAlert[]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return [];

  const monthYear = currentMonthYear();
  const { start, end } = monthRange(monthYear);

  const [{ data: budgets }, { data: txns }] = await Promise.all([
    supabase
      .from("budgets")
      .select("category_id,limit_amount, categories(name)")
      .eq("month_year", monthYear),
    supabase
      .from("transactions")
      .select("category_id, amount")
      .eq("type", "expense")
      .gte("date", start)
      .lte("date", end),
  ]);

  if (!budgets?.length) return [];

  const spent: Record<string, number> = {};
  (txns ?? []).forEach((t) => {
    if (!t.category_id) return;
    spent[t.category_id] = (spent[t.category_id] ?? 0) + Number(t.amount);
  });

  type Row = {
    user_id: string;
    category_id: string;
    month_year: string;
    threshold: number;
  };
  const rows: Row[] = [];
  const fresh: FreshAlert[] = [];

  for (const b of budgets) {
    const limit = Number(b.limit_amount);
    if (limit <= 0) continue;
    const used = spent[b.category_id] ?? 0;
    const pct = (used / limit) * 100;
    const name =
      (b.categories as { name?: string } | null)?.name ?? "Category";

    for (const threshold of [80, 100] as const) {
      if (pct >= threshold) {
        rows.push({
          user_id: user.id,
          category_id: b.category_id,
          month_year: monthYear,
          threshold,
        });
        fresh.push({ categoryName: name, threshold });
      }
    }
  }

  if (!rows.length) return [];

  // Find which ones already exist so we can return only newly-created ones for toasts.
  const { data: existing } = await supabase
    .from("budget_alerts")
    .select("category_id, threshold")
    .eq("user_id", user.id)
    .eq("month_year", monthYear);

  const existingKey = new Set(
    (existing ?? []).map((e) => `${e.category_id}:${e.threshold}`),
  );

  const newOnes = fresh.filter(
    (_, i) => !existingKey.has(`${rows[i].category_id}:${rows[i].threshold}`),
  );

  await supabase
    .from("budget_alerts")
    .upsert(rows, {
      onConflict: "user_id,category_id,month_year,threshold",
      ignoreDuplicates: true,
    });

  return newOnes;
}
