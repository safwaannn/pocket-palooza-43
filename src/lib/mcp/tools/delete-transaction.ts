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
  name: "delete_transaction",
  title: "Delete transaction",
  description:
    "Permanently delete a transaction owned by the signed-in user. Useful for removing duplicates or mistaken entries. Writes are scoped by Supabase RLS.",
  inputSchema: {
    id: z.string().uuid().describe("Transaction ID to delete."),
  },
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    const { data, error } = await client
      .from("transactions")
      .delete()
      .eq("id", id)
      .select("id,amount,type,date")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return {
        content: [{ type: "text", text: `No transaction found with id ${id}` }],
        isError: true,
      };
    }
    return {
      content: [{ type: "text", text: `Deleted transaction ${id}.` }],
      structuredContent: { deleted: data },
    };
  },
});
