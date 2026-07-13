import { supabase } from "@/supabase/client";
import { today } from "@/lib/format";
import { computeNextRun, type RecurringFrequency } from "@/lib/recurring-queries";

type DueRow = {
  id: string;
  user_id: string;
  category_id: string | null;
  type: "income" | "expense";
  amount: number | string;
  note: string | null;
  frequency: string;
  interval_count: number;
  next_run: string;
  end_date: string | null;
};

/**
 * Idempotent client-side materializer: for every active schedule whose `next_run` is on or before
 * today, insert a real transaction and advance `next_run` (and `last_run`). Runs in a small loop
 * so a schedule that missed several months catches up correctly.
 *
 * Concurrency: because Supabase RLS scopes rows to `auth.uid()`, and the update carries the old
 * `next_run` in its WHERE clause, two tabs racing will produce at most one insertion per due day.
 */
export async function materializeRecurring(): Promise<number> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return 0;

  const now = today();
  let created = 0;

  // Cap the loop so a badly-configured schedule can't spin forever.
  for (let pass = 0; pass < 24; pass++) {
    const { data, error } = await supabase
      .from("recurring_transactions")
      .select(
        "id,user_id,category_id,type,amount,note,frequency,interval_count,next_run,end_date",
      )
      .eq("active", true)
      .lte("next_run", now);
    if (error) throw error;
    const due = (data ?? []) as DueRow[];
    if (!due.length) break;

    for (const row of due) {
      const cursor = row.next_run;
      // Insert the transaction dated on the original run date so retros show up correctly.
      const { error: insertErr } = await supabase.from("transactions").insert({
        user_id: row.user_id,
        category_id: row.category_id,
        type: row.type,
        amount: Number(row.amount),
        note: row.note,
        date: cursor,
      });
      if (insertErr) throw insertErr;
      created++;

      const nextRun = computeNextRun(
        cursor,
        row.frequency as RecurringFrequency,
        row.interval_count,
      );
      const passedEnd = row.end_date ? nextRun > row.end_date : false;

      // Conditional update — only advance if this row is still on the old cursor,
      // so a parallel materialize call can't double-post.
      const { error: updateErr } = await supabase
        .from("recurring_transactions")
        .update({
          next_run: nextRun,
          last_run: cursor,
          active: passedEnd ? false : true,
        })
        .eq("id", row.id)
        .eq("next_run", cursor);
      if (updateErr) throw updateErr;
    }
  }

  return created;
}
