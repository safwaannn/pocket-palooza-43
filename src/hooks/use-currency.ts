import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { supabase } from "@/supabase/client";
import {
  DEFAULT_CURRENCY,
  formatMoney,
  getCurrencyInfo,
  type CurrencyCode,
  type CurrencyInfo,
} from "@/lib/currency";

/**
 * Reads `profiles.currency` for the current user and exposes a memoized formatter.
 * Falls back to INR while loading or when signed out, so nothing ever renders as `NaN`.
 * Data is cached under a stable key so every component that calls the hook shares one request.
 */
export function useCurrency(): {
  code: CurrencyCode;
  info: CurrencyInfo;
  format: (amount: number) => string;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["profile", "currency"],
    // 5 minutes — currency doesn't change often, and Settings invalidates on save.
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<CurrencyCode> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return DEFAULT_CURRENCY;
      const { data: profile } = await supabase
        .from("profiles")
        .select("currency")
        .eq("id", userData.user.id)
        .maybeSingle();
      const code = (profile?.currency ?? DEFAULT_CURRENCY).toUpperCase();
      return code as CurrencyCode;
    },
  });

  const code = data ?? DEFAULT_CURRENCY;
  const info = getCurrencyInfo(code);
  const format = useCallback((amount: number) => formatMoney(amount, code), [code]);

  return { code, info, format, isLoading };
}
