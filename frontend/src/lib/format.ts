import { formatMoney, DEFAULT_CURRENCY } from "@/lib/currency";

/**
 * Formats a number as Indian Rupees (INR) currency.
 * @deprecated Prefer `useCurrency().format(n)` inside components so the user's chosen
 * currency is respected. This helper is kept for backwards compatibility with utility
 * modules that can't call React hooks.
 */
export const formatINR = (n: number) => formatMoney(n || 0, DEFAULT_CURRENCY);

/**
 * Currency-agnostic formatter. Accepts an ISO 4217 code (e.g. "USD"). Falls back to INR.
 */
export const formatCurrency = (n: number, code?: string | null) => formatMoney(n || 0, code);

/**
 * Formats a number as a percentage string
 * @param n - The number to format
 * @param digits - Number of decimal places (default: 0)
 * @returns Formatted percentage string (e.g., "75%")
 */
export const formatPercent = (n: number, digits = 0) =>
  `${(n || 0).toFixed(digits)}%`;

/**
 * Formats an ISO date string to a readable format
 * @param iso - ISO date string
 * @returns Formatted date string (e.g., "15 Jan 2024")
 */
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/**
 * Returns today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/**
 * Returns the current month and year in YYYY-MM format
 * @returns Current month-year string
 */
export const currentMonthYear = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

/**
 * Converts a month-year string to a readable label
 * @param my - Month-year string in YYYY-MM format
 * @returns Readable month label (e.g., "January 2024")
 */
export const monthYearLabel = (my: string) => {
  const [y, m] = my.split("-");
  const d = new Date(Number(y), Number(m) - 1, 1);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
};

/**
 * Returns a date string for N months ago
 * @param count - Number of months ago
 * @returns ISO date string
 */
export const monthsAgo = (count: number): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - count);
  date.setDate(1);
  return date.toISOString().slice(0, 10);
};

/**
 * Returns the start and end dates for a given month
 * @param my - Month-year string in YYYY-MM format
 * @returns Object with start and end date strings
 */
export const monthRange = (my: string): { start: string; end: string } => {
  const [y, m] = my.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { start: fmt(start), end: fmt(end) };
};
