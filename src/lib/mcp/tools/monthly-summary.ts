import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function monthRange(monthYear: string) {
  const [y, m] = monthYear.split("-").map(Number);
  if (!y || !m) throw new Error("month must be YYYY-MM");
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

export default defineTool({
  name: "monthly_summary",
  title: "Monthly summary",
  description:
    "Summarize income, expenses, balance, and per-category expense totals for a given month for the signed-in user.",
  inputSchema: {
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("Month in YYYY-MM. Defaults to the current month."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ month }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const now = new Date();
    const my = month ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
    const { start, end } = monthRange(my);
    const client = supabaseForUser(ctx);
    const { data, error } = await client
      .from("transactions")
      .select("amount,type,category:categories(name)")
      .gte("date", start)
      .lte("date", end);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    let income = 0;
    let expense = 0;
    const byCategory: Record<string, number> = {};
    for (const row of (data ?? []) as unknown as Array<{
      amount: number | string;
      type: string;
      category: { name: string } | null;
    }>) {

      const amt = Number(row.amount);
      if (row.type === "income") income += amt;
      else {
        expense += amt;
        const key = row.category?.name ?? "Uncategorized";
        byCategory[key] = (byCategory[key] ?? 0) + amt;
      }
    }
    const summary = {
      month: my,
      income,
      expense,
      balance: income - expense,
      expenses_by_category: Object.entries(byCategory)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary, null, 2) }],
      structuredContent: summary,
    };
  },
});
