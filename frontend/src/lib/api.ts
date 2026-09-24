/**
 * ============================================================================
 * API CLIENT — the one place that talks to the Express/MongoDB backend
 * ============================================================================
 *
 * Every network call in the app goes through `api()`. It:
 *   - prefixes the configured base URL (VITE_API_URL, default localhost:3000)
 *   - always sends `credentials: 'include'` so the httpOnly JWT cookie
 *     round-trips (the backend also accepts an Authorization: Bearer token)
 *   - sets JSON headers on requests that have a body
 *   - unwraps the backend's `{ status, data }` envelope
 *   - turns a non-2xx response into a thrown Error carrying the server's
 *     `message`, so React Query / try-catch surfaces a useful toast
 *
 * The backend returns Mongoose documents shaped as `{ _id, user, category, ...}`
 * with a virtual `id`. The front-end types were written for the old Supabase
 * schema (`id`, `user_id`, `category_id`). The small mappers at the bottom
 * translate between the two so no UI component needs to change.
 */

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:3000";

const API_PREFIX = "/api/v1";

/* ============================================================================
 * AUTH TOKEN STORE
 * ----------------------------------------------------------------------------
 * The backend sets an httpOnly `jwt` cookie AND returns the token in the JSON
 * body. In a cross-origin dev setup (frontend :5173, API :3000) the cookie is
 * issued with `SameSite=Strict`, so the browser will NOT send it back on the
 * cross-site `fetch` calls this client makes — which made post-signup/login
 * session checks (GET /users/me) fail and bounce the user back to /auth.
 *
 * To make auth reliable across origins we also keep the token client-side and
 * attach it as `Authorization: Bearer <token>` on every request. The backend's
 * `protect` middleware already accepts this header. We keep sending the cookie
 * too (`credentials: 'include'`) so same-site production deploys still work.
 * ==========================================================================*/
const TOKEN_KEY = "paisa.auth.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* localStorage unavailable (private mode / SSR) — cookie remains the fallback */
  }
}

/** Pull a `token` field out of an auth response envelope and persist it. */
function captureToken(json: unknown): void {
  if (json && typeof json === "object" && "token" in json) {
    const token = (json as { token?: unknown }).token;
    if (typeof token === "string" && token.length > 0) setToken(token);
  }
}

type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** When false, a non-2xx does not throw (used for optional/best-effort calls). */
  throwOnError?: boolean;
};

/**
 * Core request helper. Returns the parsed `data` field of the response
 * envelope (or the whole body if there is no envelope). Throws on non-2xx.
 */
export async function api<T = unknown>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = "GET", body, throwOnError = true } = options;

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const init: RequestInit = {
    method,
    credentials: "include",
    headers,
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, init);

  // 204 No Content — nothing to parse.
  if (res.status === 204) return undefined as T;

  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    // Non-JSON body (rare) — leave json null.
  }

  captureToken(json);

  if (!res.ok && throwOnError) {
    const message =
      (json as { message?: string } | null)?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }

  // Unwrap { status, data, ... } if present; otherwise return the raw body.
  if (json && typeof json === "object" && "data" in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

/**
 * Like `api`, but returns the FULL envelope (status, data, token, results, …).
 * Used by auth calls that also need the token, and list calls that want
 * pagination metadata.
 */
export async function apiRaw<T = Record<string, unknown>>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { method = "GET", body } = options;

  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const init: RequestInit = { method, credentials: "include", headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${API_PREFIX}${path}`, init);
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }

  captureToken(json);

  if (!res.ok) {
    const message =
      (json as { message?: string } | null)?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return json as T;
}

/* ============================================================================
 * SHAPE MAPPERS — backend Mongoose docs → front-end types
 * ==========================================================================*/

type RawCategory = {
  id?: string;
  _id?: string;
  user?: string | null;
  name: string;
  type: "income" | "expense";
};

type RawTransaction = {
  id?: string;
  _id?: string;
  user?: string;
  category?: RawCategory | string | null;
  amount: number;
  type: "income" | "expense";
  note: string | null;
  date: string;
  createdAt?: string;
};

type RawBudget = {
  id?: string;
  _id?: string;
  user?: string;
  category?: RawCategory | string | null;
  month_year: string;
  limit_amount: number;
};

const idOf = (v: { id?: string; _id?: string }) => v.id ?? v._id ?? "";

export const mapCategory = (c: RawCategory) => ({
  id: idOf(c),
  user_id: (c.user ?? null) as string | null,
  name: c.name,
  type: c.type,
});

/** A populated category object, a bare id string, or null → normalized. */
const mapNestedCategory = (
  cat: RawCategory | string | null | undefined,
): { category: ReturnType<typeof mapCategory> | null; categoryId: string | null } => {
  if (!cat) return { category: null, categoryId: null };
  if (typeof cat === "string") return { category: null, categoryId: cat };
  return { category: mapCategory(cat), categoryId: idOf(cat) };
};

export const mapTransaction = (t: RawTransaction) => {
  const { category, categoryId } = mapNestedCategory(t.category);
  return {
    id: idOf(t),
    user_id: (t.user ?? "") as string,
    category_id: categoryId,
    category,
    amount: Number(t.amount),
    type: t.type,
    note: t.note ?? null,
    // Backend stores a Date; normalize to YYYY-MM-DD for the UI.
    date: (t.date ?? "").slice(0, 10),
    created_at: t.createdAt ?? "",
  };
};

export const mapBudget = (b: RawBudget) => {
  const { category, categoryId } = mapNestedCategory(b.category);
  return {
    id: idOf(b),
    user_id: (b.user ?? "") as string,
    category_id: categoryId ?? "",
    category,
    month_year: b.month_year,
    limit_amount: Number(b.limit_amount),
  };
};
