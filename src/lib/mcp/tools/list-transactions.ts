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
  name: "list_transactions",
  title: "List transactions",
  description:
    "List the signed-in user's income and expense transactions, optionally filtered by date range, type, or category name. Returns most recent first.",
  inputSchema: {
    start_date: z
      .string()
      .optional()
      .describe("Inclusive start date in YYYY-MM-DD."),
    end_date: z
      .string()
      .optional()
      .describe("Inclusive end date in YYYY-MM-DD."),
    type: z
      .enum(["income", "expense"])
      .optional()
      .describe("Filter by transaction type."),
    category_name: z
      .string()
      .optional()
      .describe("Case-insensitive category name filter."),
    limit: z
      .number()
      .int()
      .positive()
      .max(200)
      .optional()
      .describe("Maximum rows to return. Defaults to 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ start_date, end_date, type, category_name, limit }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    let q = client
      .from("transactions")
      .select("id,amount,type,note,date,created_at,category:categories(id,name,type)")
      .order("date", { ascending: false })
      .limit(limit ?? 50);
    if (start_date) q = q.gte("date", start_date);
    if (end_date) q = q.lte("date", end_date);
    if (type) q = q.eq("type", type);
    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    let rows = (data ?? []) as unknown as Array<{
      id: string;
      amount: number | string;
      type: string;
      note: string | null;
      date: string;
      created_at: string;
      category: { id: string; name: string; type: string } | null;
    }>;
    if (category_name) {
      const needle = category_name.toLowerCase();
      rows = rows.filter((r) => r.category?.name.toLowerCase().includes(needle));
    }
    const shaped = rows.map((r) => ({
      id: r.id,
      date: r.date,
      type: r.type,
      amount: Number(r.amount),
      note: r.note,
      category: r.category?.name ?? null,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(shaped, null, 2) }],
      structuredContent: { transactions: shaped, count: shaped.length },
    };
  },
});
