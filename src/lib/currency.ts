/**
 * Supported display currencies. The formatter uses Intl.NumberFormat which knows how to render
 * each of these, so the list is really just a UI whitelist.
 */
export type CurrencyCode =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "JPY"
  | "AUD"
  | "CAD"
  | "SGD"
  | "AED";

export type CurrencyInfo = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  locale: string;
};

export const CURRENCIES: readonly CurrencyInfo[] = [
  { code: "INR", label: "Indian Rupee",       symbol: "₹",  locale: "en-IN" },
  { code: "USD", label: "US Dollar",          symbol: "$",  locale: "en-US" },
  { code: "EUR", label: "Euro",               symbol: "€",  locale: "en-IE" },
  { code: "GBP", label: "British Pound",      symbol: "£",  locale: "en-GB" },
  { code: "JPY", label: "Japanese Yen",       symbol: "¥",  locale: "ja-JP" },
  { code: "AUD", label: "Australian Dollar",  symbol: "A$", locale: "en-AU" },
  { code: "CAD", label: "Canadian Dollar",    symbol: "C$", locale: "en-CA" },
  { code: "SGD", label: "Singapore Dollar",   symbol: "S$", locale: "en-SG" },
  { code: "AED", label: "UAE Dirham",         symbol: "د.إ", locale: "en-AE" },
] as const;

const CURRENCY_MAP: Record<string, CurrencyInfo> = Object.fromEntries(
  CURRENCIES.map((c) => [c.code, c]),
);

export const DEFAULT_CURRENCY: CurrencyCode = "INR";

export function getCurrencyInfo(code: string | null | undefined): CurrencyInfo {
  if (!code) return CURRENCY_MAP[DEFAULT_CURRENCY];
  return CURRENCY_MAP[code.toUpperCase()] ?? CURRENCY_MAP[DEFAULT_CURRENCY];
}

export function isSupportedCurrency(code: string): code is CurrencyCode {
  return Object.prototype.hasOwnProperty.call(CURRENCY_MAP, code.toUpperCase());
}

/**
 * Format a number as currency using the given ISO 4217 code (falls back to INR).
 * We use zero fraction digits by default to match the app's existing "₹1,00,000" style.
 */
export function formatMoney(
  amount: number,
  code: string | null | undefined = DEFAULT_CURRENCY,
  options: { maximumFractionDigits?: number; minimumFractionDigits?: number } = {},
): string {
  const info = getCurrencyInfo(code);
  const fractionDigits = code?.toUpperCase() === "JPY" ? 0 : (options.maximumFractionDigits ?? 0);
  return new Intl.NumberFormat(info.locale, {
    style: "currency",
    currency: info.code,
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
  }).format(amount || 0);
}

export const currencySymbol = (code: string | null | undefined): string =>
  getCurrencyInfo(code).symbol;
