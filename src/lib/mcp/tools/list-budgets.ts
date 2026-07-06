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
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 0));
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

export default defineTool({
  name: "list_budgets",
  title: "List budgets",
  description:
    "List the signed-in user's category budgets for a given month, with amount spent, remaining, and percent used.",
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
    const client = supabaseForUser(ctx);
    const [budgetsRes, txRes] = await Promise.all([
      client
        .from("budgets")
        .select("id,category_id,limit_amount,month_year,category:categories(name)")
        .eq("month_year", my),
      (async () => {
        const { start, end } = monthRange(my);
        return client
          .from("transactions")
          .select("amount,category_id,type")
          .eq("type", "expense")
          .gte("date", start)
          .lte("date", end);
      })(),
    ]);
    if (budgetsRes.error)
      return { content: [{ type: "text", text: budgetsRes.error.message }], isError: true };
    if (txRes.error)
      return { content: [{ type: "text", text: txRes.error.message }], isError: true };

    const spent = new Map<string, number>();
    for (const t of (txRes.data ?? []) as Array<{ amount: number | string; category_id: string | null }>) {
      if (!t.category_id) continue;
      spent.set(t.category_id, (spent.get(t.category_id) ?? 0) + Number(t.amount));
    }
    const rows = ((budgetsRes.data ?? []) as unknown as Array<{
      id: string;
      category_id: string;
      limit_amount: number | string;
      month_year: string;
      category: { name: string } | null;
    }>).map((b) => {

      const limit = Number(b.limit_amount);
      const used = spent.get(b.category_id) ?? 0;
      return {
        id: b.id,
        month: b.month_year,
        category: b.category?.name ?? "Uncategorized",
        limit,
        spent: used,
        remaining: Math.max(0, limit - used),
        percent_used: limit > 0 ? Math.round((used / limit) * 100) : 0,
      };
    });
    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { month: my, budgets: rows },
    };
  },
});
