import { type QueryClient, useQuery } from "@tanstack/react-query";
import { api, mapBudget, mapCategory, mapTransaction } from "@/lib/api";

export type TransactionType = "income" | "expense";

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  type: TransactionType;
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  category: Category | null;
  amount: number;
  type: TransactionType;
  note: string | null;
  date: string;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  category: Category | null;
  month_year: string;
  limit_amount: number;
};

export type TransactionFilters = {
  start?: string;
  end?: string;
  type?: TransactionType | "all";
  categoryId?: string | "all";
  search?: string;
};

const normalizeSearch = (value?: string) => value?.trim().toLowerCase() ?? "";

const matchesSearch = (transaction: Transaction, search: string) => {
  if (!search) return true;
  return (
    transaction.note?.toLowerCase().includes(search) ||
    transaction.category?.name.toLowerCase().includes(search) ||
    transaction.type.includes(search)
  );
};

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    // Categories change rarely — cache them for 10 minutes.
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<Category[]> => {
      const data = await api<unknown[]>("/categories");
      return (data ?? []).map((c) => mapCategory(c as never));
    },
  });

export const useTransactions = (filters: TransactionFilters = {}, limit?: number) =>
  useQuery({
    queryKey: ["transactions", filters, limit],
    // Transactions are fresh for 2 minutes — avoids hammering the API while
    // the user navigates between pages that all use transaction data.
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<Transaction[]> => {
      // Build the query string the backend understands (date range, type,
      // category, sort, limit). Text search is applied client-side because the
      // backend has no full-text filter — matching the previous behaviour.
      const params = new URLSearchParams();
      params.set("sort", "-date");
      if (filters.start) params.set("date[gte]", filters.start);
      if (filters.end) params.set("date[lte]", filters.end);
      if (filters.type && filters.type !== "all") params.set("type", filters.type);
      if (filters.categoryId && filters.categoryId !== "all") {
        params.set("category", filters.categoryId);
      }
      if (limit) params.set("limit", String(limit));
      else params.set("limit", "100");

      const data = await api<unknown[]>(`/transactions?${params.toString()}`);
      const search = normalizeSearch(filters.search);
      return (data ?? [])
        .map((t) => mapTransaction(t as never))
        .filter((t) => matchesSearch(t, search));
    },
  });

export const useBudgets = (monthYear: string) =>
  useQuery({
    queryKey: ["budgets", monthYear],
    // Budget limits don't change mid-session — 5 minutes is safe.
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Budget[]> => {
      const params = new URLSearchParams({
        month_year: monthYear,
        sort: "-limit_amount",
        limit: "100",
      });
      const data = await api<unknown[]>(`/budgets?${params.toString()}`);
      return (data ?? []).map((b) => mapBudget(b as never));
    },
  });

export const useMonthlySpending = (monthYear: string) =>
  useQuery({
    queryKey: ["spent-by-cat", monthYear],
    // Spending totals update only when a transaction is added/changed, not
    // by the clock — 3 minutes prevents redundant recalculation calls.
    staleTime: 3 * 60 * 1000,
    queryFn: async (): Promise<Record<string, number>> => {
      // Backend returns a { categoryId: total } map directly.
      const data = await api<Record<string, number>>(
        `/transactions/spending?month_year=${monthYear}`,
      );
      return data ?? {};
    },
  });

export const invalidateMoneyViews = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: ["transactions"] });
  void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  void queryClient.invalidateQueries({ queryKey: ["budgets"] });
  void queryClient.invalidateQueries({ queryKey: ["spent-by-cat"] });
  void queryClient.invalidateQueries({ queryKey: ["reports"] });
};

export const invalidateCategoryViews = (queryClient: QueryClient) => {
  void queryClient.invalidateQueries({ queryKey: ["categories"] });
  invalidateMoneyViews(queryClient);
};
