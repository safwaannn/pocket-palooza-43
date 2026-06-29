import { type QueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { monthRange } from "@/lib/format";

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

type TransactionRow = Omit<Transaction, "amount" | "category"> & {
  amount: number | string;
  categories?: Category | null;
};

type BudgetRow = Omit<Budget, "limit_amount" | "category"> & {
  limit_amount: number | string;
  categories?: Category | null;
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
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,user_id,name,type")
        .order("type")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

export const useTransactions = (filters: TransactionFilters = {}, limit?: number) =>
  useQuery({
    queryKey: ["transactions", filters, limit],
    queryFn: async (): Promise<Transaction[]> => {
      let q = supabase
        .from("transactions")
        .select("*, categories(id,user_id,name,type)")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (filters.start) q = q.gte("date", filters.start);
      if (filters.end) q = q.lte("date", filters.end);
      if (filters.type && filters.type !== "all") q = q.eq("type", filters.type);
      if (filters.categoryId && filters.categoryId !== "all") {
        q = q.eq("category_id", filters.categoryId);
      }
      if (limit) q = q.limit(limit);

      const { data, error } = await q;
      if (error) throw error;

      const search = normalizeSearch(filters.search);
      return ((data ?? []) as TransactionRow[])
        .map((transaction) => ({
          ...transaction,
          amount: Number(transaction.amount),
          category: transaction.categories ?? null,
        }))
        .filter((transaction) => matchesSearch(transaction, search));
    },
  });

export const useBudgets = (monthYear: string) =>
  useQuery({
    queryKey: ["budgets", monthYear],
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*, categories(id,user_id,name,type)")
        .eq("month_year", monthYear)
        .order("limit_amount", { ascending: false });
      if (error) throw error;
      return ((data ?? []) as BudgetRow[]).map((budget) => ({
        ...budget,
        limit_amount: Number(budget.limit_amount),
        category: budget.categories ?? null,
      }));
    },
  });

export const useMonthlySpending = (monthYear: string) =>
  useQuery({
    queryKey: ["spent-by-cat", monthYear],
    queryFn: async (): Promise<Record<string, number>> => {
      const { start, end } = monthRange(monthYear);
      const { data, error } = await supabase
        .from("transactions")
        .select("category_id,amount")
        .eq("type", "expense")
        .gte("date", start)
        .lte("date", end);
      if (error) throw error;

      const out: Record<string, number> = {};
      (data ?? []).forEach((row) => {
        if (!row.category_id) return;
        out[row.category_id] = (out[row.category_id] ?? 0) + Number(row.amount);
      });
      return out;
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
