import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { api } from "@/lib/api";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  getCurrencyInfo,
  type CurrencyCode,
  type CurrencyInfo,
} from "@/lib/currency";

/**
 * Reads the current user's preferred currency from GET /users/me and exposes a
 * memoized money formatter. Falls back to INR while loading or when signed out.
 */
export function useCurrency(): {
  code: CurrencyCode;
  info: CurrencyInfo;
  format: (amount: number) => string;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["profile", "currency"],
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CurrencyCode> => {
      try {
        const user = await api<{ currency?: string }>("/users/me");
        const code = (user?.currency ?? DEFAULT_CURRENCY).toUpperCase();
        return code as CurrencyCode;
      } catch {
        return DEFAULT_CURRENCY;
      }
    },
  });

  const code = data ?? DEFAULT_CURRENCY;
  const info = getCurrencyInfo(code);
  const format = useCallback((amount: number) => formatMoney(amount, code), [code]);

  return { code, info, format, isLoading };
}
