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

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

export default defineTool({
  name: "spending_summary",
  title: "Spending summary",
  description:
    "Aggregate the signed-in user's income and expense totals across one or more months, with per-category breakdowns and per-month series. Suitable for dashboard widgets and textual agent responses. Defaults to the current month when no range is given.",
  inputSchema: {
    month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("Single month in YYYY-MM. Ignored when start_month/end_month are set."),
    start_month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("Inclusive start month in YYYY-MM for a multi-month range."),
    end_month: z
      .string()
      .regex(/^\d{4}-\d{2}$/)
      .optional()
      .describe("Inclusive end month in YYYY-MM for a multi-month range."),
    top_categories: z
      .number()
      .int()
      .positive()
      .max(50)
      .optional()
      .describe("Limit the category breakdown to the top N expense categories. Defaults to 10."),
    format: z
      .enum(["json", "text"])
      .optional()
      .describe(
        "'json' returns machine-readable structured content only; 'text' also includes a human-readable narrative. Defaults to 'text'.",
      ),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ month, start_month, end_month, top_categories, format }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const now = new Date();
    const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;

    let rangeStart: string;
    let rangeEnd: string;
    let months: string[] = [];
    if (start_month || end_month) {
      const s = start_month ?? end_month ?? currentMonth;
      const e = end_month ?? start_month ?? currentMonth;
      if (s > e) {
        return {
          content: [{ type: "text", text: "start_month must be on or before end_month" }],
          isError: true,
        };
      }
      const [sy, sm] = s.split("-").map(Number);
      const [ey, em] = e.split("-").map(Number);
      for (let y = sy, m = sm; y < ey || (y === ey && m <= em); ) {
        months.push(`${y}-${String(m).padStart(2, "0")}`);
        m++;
        if (m > 12) {
          m = 1;
          y++;
        }
      }
      rangeStart = monthRange(s).start;
      rangeEnd = monthRange(e).end;
    } else {
      const my = month ?? currentMonth;
      months = [my];
      const r = monthRange(my);
      rangeStart = r.start;
      rangeEnd = r.end;
    }

    const client = supabaseForUser(ctx);
    const { data, error } = await client
      .from("transactions")
      .select("amount,type,date,category:categories(name)")
      .gte("date", rangeStart)
      .lte("date", rangeEnd);
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    let income = 0;
    let expense = 0;
    const byCategory: Record<string, number> = {};
    const byMonth: Record<string, { income: number; expense: number }> = {};
    for (const m of months) byMonth[m] = { income: 0, expense: 0 };

    for (const row of (data ?? []) as unknown as Array<{
      amount: number | string;
      type: string;
      date: string;
      category: { name: string } | null;
    }>) {
      const amt = Number(row.amount);
      const mk = monthKey(row.date);
      const bucket = byMonth[mk] ?? (byMonth[mk] = { income: 0, expense: 0 });
      if (row.type === "income") {
        income += amt;
        bucket.income += amt;
      } else {
        expense += amt;
        bucket.expense += amt;
        const key = row.category?.name ?? "Uncategorized";
        byCategory[key] = (byCategory[key] ?? 0) + amt;
      }
    }

    const limit = top_categories ?? 10;
    const categoriesRanked = Object.entries(byCategory)
      .map(([name, total]) => ({
        name,
        total,
        share: expense > 0 ? Math.round((total / expense) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total - a.total);
    const topCats = categoriesRanked.slice(0, limit);

    const monthSeries = Object.entries(byMonth)
      .map(([m, v]) => ({ month: m, income: v.income, expense: v.expense, balance: v.income - v.expense }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const summary = {
      range: { start: rangeStart, end: rangeEnd, months },
      totals: { income, expense, balance: income - expense },
      by_month: monthSeries,
      top_expense_categories: topCats,
      category_count: categoriesRanked.length,
    };

    const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const narrative = [
      months.length === 1
        ? `In ${months[0]}, income was ${fmt(income)} and expenses were ${fmt(expense)} (net ${fmt(income - expense)}).`
        : `From ${months[0]} to ${months[months.length - 1]}, income totalled ${fmt(income)} and expenses ${fmt(expense)} (net ${fmt(income - expense)}).`,
      topCats.length > 0
        ? `Top expense categories: ${topCats.map((c) => `${c.name} (${fmt(c.total)}, ${c.share}%)`).join("; ")}.`
        : "No expenses recorded in this range.",
    ].join(" ");

    const wantJsonOnly = format === "json";
    return {
      content: [
        {
          type: "text",
          text: wantJsonOnly ? JSON.stringify(summary, null, 2) : narrative,
        },
      ],
      structuredContent: summary,
    };
  },
});
