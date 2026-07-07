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
  name: "upsert_budget",
  title: "Create or update budget",
  description:
    "Create a new monthly budget or update the existing one for a category and month for the signed-in user. Resolves the category by name (case-insensitive) among the user's expense categories. Writes are scoped by Supabase RLS.",
  inputSchema: {
    category_name: z
      .string()
      .trim()
      .min(1)
      .describe("Expense category name; must already exist for this user."),
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .describe("Budget month in YYYY-MM."),
    limit_amount: z
      .number()
      .positive()
      .describe("Spending limit for the month in the user's currency. Must be greater than 0."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ category_name, month, limit_amount }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const client = supabaseForUser(ctx);
    const { data: cats, error: catErr } = await client
      .from("categories")
      .select("id,name,type")
      .eq("type", "expense");
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
            text: `No expense category matches "${category_name}". Available: ${(cats ?? []).map((c) => c.name).join(", ") || "(none)"}`,
          },
        ],
        isError: true,
      };
    }

    const { data: existing, error: exErr } = await client
      .from("budgets")
      .select("id")
      .eq("category_id", match.id)
      .eq("month_year", month)
      .maybeSingle();
    if (exErr) return { content: [{ type: "text", text: exErr.message }], isError: true };

    let action: "created" | "updated";
    let row;
    if (existing?.id) {
      const { data, error } = await client
        .from("budgets")
        .update({ limit_amount })
        .eq("id", existing.id)
        .select("id,category_id,limit_amount,month_year")
        .single();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      row = data;
      action = "updated";
    } else {
      const { data, error } = await client
        .from("budgets")
        .insert({
          user_id: ctx.getUserId(),
          category_id: match.id,
          month_year: month,
          limit_amount,
        })
        .select("id,category_id,limit_amount,month_year")
        .single();
      if (error) return { content: [{ type: "text", text: error.message }], isError: true };
      row = data;
      action = "created";
    }

    return {
      content: [
        {
          type: "text",
          text: `${action === "created" ? "Created" : "Updated"} budget for ${match.name} in ${month} at ${limit_amount}.`,
        },
      ],
      structuredContent: { action, budget: { ...row, category: match.name } },
    };
  },
});
