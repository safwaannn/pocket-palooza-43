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
  name: "update_transaction",
  title: "Update transaction",
  description:
    "Edit an existing transaction owned by the signed-in user. Any subset of fields can be updated. When category_name is provided, it is resolved case-insensitively against the user's categories of the transaction's (updated) type.",
  inputSchema: {
    id: z.string().uuid().describe("Transaction ID to update."),
    amount: z.number().positive().optional().describe("New amount in the user's currency."),
    type: z
      .enum(["income", "expense"])
      .optional()
      .describe("Change the transaction type; will also re-resolve the category if provided."),
    category_name: z
      .string()
      .trim()
      .min(1)
      .optional()
      .describe("New category name; must exist for the user with the effective type."),
    date: z.string().optional().describe("New transaction date in YYYY-MM-DD."),
    note: z.string().nullable().optional().describe("New note; pass null to clear."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, amount, type, category_name, date, note }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    const { data: current, error: curErr } = await client
      .from("transactions")
      .select("id,type")
      .eq("id", id)
      .maybeSingle();
    if (curErr) return { content: [{ type: "text", text: curErr.message }], isError: true };
    if (!current) {
      return { content: [{ type: "text", text: `No transaction found with id ${id}` }], isError: true };
    }

    const patch: Record<string, unknown> = {};
    if (amount !== undefined) patch.amount = amount;
    if (type !== undefined) patch.type = type;
    if (date !== undefined) patch.date = date;
    if (note !== undefined) patch.note = note;

    if (category_name !== undefined) {
      const effectiveType = type ?? current.type;
      const { data: cats, error: catErr } = await client
        .from("categories")
        .select("id,name,type")
        .eq("type", effectiveType);
      if (catErr) return { content: [{ type: "text", text: catErr.message }], isError: true };
      const needle = category_name.toLowerCase();
      const match =
        (cats ?? []).find((c) => c.name.toLowerCase() === needle) ??
        (cats ?? []).find((c) => c.name.toLowerCase().includes(needle));
      if (!match) {
        return {
          content: [
            {
              type: "text",
              text: `No ${effectiveType} category matches "${category_name}". Available: ${(cats ?? []).map((c) => c.name).join(", ") || "(none)"}`,
            },
          ],
          isError: true,
        };
      }
      patch.category_id = match.id;
    }

    if (Object.keys(patch).length === 0) {
      return {
        content: [{ type: "text", text: "No fields provided to update." }],
        isError: true,
      };
    }

    const { data, error } = await client
      .from("transactions")
      .update(patch)
      .eq("id", id)
      .select("id,amount,type,note,date,category:categories(name)")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [
        {
          type: "text",
          text: `Updated transaction ${id}.`,
        },
      ],
      structuredContent: { transaction: data },
    };
  },
});
