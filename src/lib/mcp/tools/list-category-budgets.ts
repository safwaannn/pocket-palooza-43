import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_category_budgets",
  title: "List category budgets",
  description:
    "List the signed-in user's monthly category budgets with their IDs, category names, month, and limit amounts. Optionally filter by month or category name. Use this to identify the exact budget row an agent should update via upsert_budget.",
  inputSchema: {
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("Filter to a single month in YYYY-MM. Omit to return all months."),
    category_name: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("Case-insensitive substring match against the category name."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ month, category_name }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    let q = client
      .from("budgets")
      .select("id,category_id,month_year,limit_amount,category:categories(name)")
      .order("month_year", { ascending: false });
    if (month) q = q.eq("month_year", month);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const needle = category_name?.toLowerCase();
    const rows = ((data ?? []) as unknown as Array<{
      id: string;
      category_id: string;
      month_year: string;
      limit_amount: number | string;
      category: { name: string } | null;
    }>)
      .map((b) => ({
        id: b.id,
        category_id: b.category_id,
        category: b.category?.name ?? "Uncategorized",
        month: b.month_year,
        limit: Number(b.limit_amount),
      }))
      .filter((r) => (needle ? r.category.toLowerCase().includes(needle) : true));

    return {
      content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
      structuredContent: { budgets: rows, count: rows.length },
    };
  },
});
