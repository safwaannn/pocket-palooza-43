/**
 * Formats a number as Indian Rupees (INR) currency
 * @param n - The number to format
 * @returns Formatted currency string (e.g., "₹1,00,000")
 */
export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n || 0);

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
