import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  type: "income" | "expense";
};

export type Transaction = {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  type: "income" | "expense";
  note: string | null;
  date: string;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  month_year: string;
  limit_amount: number;
};

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("type")
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

export const useTransactions = (filters?: {
  start?: string;
  end?: string;
  type?: "income" | "expense" | "all";
  categoryId?: string | "all";
  search?: string;
}) =>
  useQuery({
    queryKey: ["transactions", filters],
    queryFn: async (): Promise<Transaction[]> => {
      let q = supabase.from("transactions").select("*").order("date", { ascending: false });
      if (filters?.start) q = q.gte("date", filters.start);
      if (filters?.end) q = q.lte("date", filters.end);
      if (filters?.type && filters.type !== "all") q = q.eq("type", filters.type);
      if (filters?.categoryId && filters.categoryId !== "all")
        q = q.eq("category_id", filters.categoryId);
      if (filters?.search) q = q.ilike("note", `%${filters.search}%`);
      const { data, error } = await q;
      if (error) throw error;
      return (data as Transaction[]).map((t) => ({ ...t, amount: Number(t.amount) }));
    },
  });

export const useBudgets = (monthYear: string) =>
  useQuery({
    queryKey: ["budgets", monthYear],
    queryFn: async (): Promise<Budget[]> => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .eq("month_year", monthYear);
      if (error) throw error;
      return (data as Budget[]).map((b) => ({ ...b, limit_amount: Number(b.limit_amount) }));
    },
  });
