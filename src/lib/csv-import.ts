/**
 * Minimal, dependency-free CSV parser. Handles:
 *   - quoted fields with embedded commas and newlines
 *   - escaped quotes ("")
 *   - CRLF or LF line endings
 *   - a leading UTF-8 BOM
 * The first row is treated as the header.
 */
export type CSVRow = Record<string, string>;

export function parseCSV(input: string): CSVRow[] {
  if (!input) return [];
  // Strip UTF-8 BOM if present.
  const text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;

  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\r") {
      // Handle CRLF by skipping the following \n.
      if (text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      field = "";
      row = [];
      continue;
    }
    field += char;
  }

  // Flush the final field/row (files without a trailing newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  if (!rows.length) return [];
  const [rawHeader, ...body] = rows;
  const header = rawHeader.map((h) => h.trim().toLowerCase());
  return body
    // Drop entirely blank lines.
    .filter((r) => r.some((cell) => cell.trim().length > 0))
    .map((r) => {
      const obj: CSVRow = {};
      header.forEach((key, idx) => {
        obj[key] = (r[idx] ?? "").trim();
      });
      return obj;
    });
}

export type ParsedTransaction = {
  date: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  note: string;
};

export type ImportRowResult =
  | { ok: true; row: ParsedTransaction; line: number }
  | { ok: false; error: string; line: number };

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Validate a parsed CSV row and coerce it into a ParsedTransaction.
 * Line numbers start at 2 (line 1 is the header) so users can find the offending row in a spreadsheet.
 */
export function validateTransactionRow(raw: CSVRow, line: number): ImportRowResult {
  const date = (raw.date ?? "").trim();
  const type = (raw.type ?? "").trim().toLowerCase();
  const category = (raw.category ?? "").trim();
  const amountStr = (raw.amount ?? "").replace(/[,\s]/g, "");
  const note = (raw.note ?? "").trim();

  if (!ISO_DATE_RE.test(date)) {
    return { ok: false, error: "date must be YYYY-MM-DD", line };
  }
  if (type !== "income" && type !== "expense") {
    return { ok: false, error: "type must be 'income' or 'expense'", line };
  }
  if (!category) {
    return { ok: false, error: "category is required", line };
  }
  const amount = Number(amountStr);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: "amount must be a positive number", line };
  }

  return {
    ok: true,
    line,
    row: { date, type, category, amount, note },
  };
}

/** Convenience — parses the file and validates every row in one call. */
export function parseTransactionsCSV(input: string): {
  valid: ParsedTransaction[];
  errors: { line: number; error: string }[];
} {
  const rows = parseCSV(input);
  const valid: ParsedTransaction[] = [];
  const errors: { line: number; error: string }[] = [];
  rows.forEach((raw, idx) => {
    const result = validateTransactionRow(raw, idx + 2);
    if (result.ok) valid.push(result.row);
    else errors.push({ line: result.line, error: result.error });
  });
  return { valid, errors };
}
