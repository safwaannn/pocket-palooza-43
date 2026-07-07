import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listTransactions from "./tools/list-transactions";
import addTransaction from "./tools/add-transaction";
import updateTransaction from "./tools/update-transaction";
import deleteTransaction from "./tools/delete-transaction";
import monthlySummary from "./tools/monthly-summary";
import spendingSummary from "./tools/spending-summary";
import listBudgets from "./tools/list-budgets";
import upsertBudget from "./tools/upsert-budget";
import listCategories from "./tools/list-categories";

// The OAuth issuer MUST be the direct Supabase host — publish rewrites
// SUPABASE_URL to a proxy that mcp-js rejects (RFC 8414 issuer mismatch).
// Vite inlines VITE_SUPABASE_PROJECT_ID at build time; the fallback keeps the
// issuer well-formed during throwaway manifest-extract evals.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "paisa-mcp",
  title: "Paisa",
  version: "0.1.0",
  instructions:
    "Tools for the Paisa personal finance app. Use these to read the signed-in user's transactions, categories, budgets, and monthly summaries, and to record new income or expenses. All data is scoped to the authenticated user via Supabase RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    listTransactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    monthlySummary,
    spendingSummary,
    listBudgets,
    upsertBudget,
    listCategories,
  ],
});
