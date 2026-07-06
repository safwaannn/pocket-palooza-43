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
  name: "add_transaction",
  title: "Add transaction",
  description:
    "Record a new income or expense for the signed-in user. Resolves the category by name (case-insensitive) among the user's categories of the given type.",
  inputSchema: {
    amount: z.number().positive().describe("Amount in the user's currency."),
    type: z.enum(["income", "expense"]).describe("Whether this is income or an expense."),
    category_name: z
      .string()
      .trim()
      .min(1)
      .describe("Category name; must already exist for this user with the given type."),
    date: z
      .string()
      .optional()
      .describe("Transaction date in YYYY-MM-DD. Defaults to today."),
    note: z.string().optional().describe("Optional short note."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ amount, type, category_name, date, note }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    const { data: cats, error: catErr } = await client
      .from("categories")
      .select("id,name,type")
      .eq("type", type);
    if (catErr) return { content: [{ type: "text", text: catErr.message }], isError: true };
    const needle = category_name.toLowerCase();
    const match = (cats ?? []).find((c) => c.name.toLowerCase() === needle)
      ?? (cats ?? []).find((c) => c.name.toLowerCase().includes(needle));
    if (!match) {
      return {
        content: [
          {
            type: "text",
            text: `No ${type} category matches "${category_name}". Available: ${(cats ?? []).map((c) => c.name).join(", ") || "(none)"}`,
          },
        ],
        isError: true,
      };
    }
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await client
      .from("transactions")
      .insert({
        user_id: ctx.getUserId(),
        category_id: match.id,
        amount,
        type,
        note: note ?? null,
        date: date ?? today,
      })
      .select("id,amount,type,note,date")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [
        { type: "text", text: `Added ${type} of ${amount} to ${match.name} on ${data.date}.` },
      ],
      structuredContent: { transaction: data },
    };
  },
});
