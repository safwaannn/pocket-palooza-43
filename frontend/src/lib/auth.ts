/**
 * ============================================================================
 * AUTH LIB — the single source of truth for authentication on the client
 * ============================================================================
 *
 * Wraps the raw `apiRaw` client with:
 *   - Zod schemas for every auth form (shared by react-hook-form resolvers)
 *   - typed functions for each backend auth endpoint
 *   - a token lifecycle that mirrors the backend (login/signup/reset all set a
 *     token; logout clears it) so the whole app stays consistent
 *
 * Backend contract (Express/Mongo, mounted at /api/v1/users):
 *   POST  /signup            { name, email, password, passwordConfirm } -> { token, data.user }
 *   POST  /login             { email, password }                        -> { token, data.user }
 *   GET   /logout                                                       -> clears cookie
 *   POST  /forgotPassword    { email }                                  -> { message }
 *   PATCH /resetPassword/:t  { password, passwordConfirm }              -> { token, data.user }
 *   GET   /me                                                           -> { data.user }
 */
import { z } from "zod";
import { apiRaw, setToken } from "@/lib/api";

/* ============================================================================
 * TYPES
 * ==========================================================================*/
export type AuthUser = {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: "viewer" | "user" | "manager" | "admin";
  currency: string;
};

type AuthEnvelope = {
  status: string;
  token?: string;
  data?: { user: AuthUser };
};

/* ============================================================================
 * VALIDATION SCHEMAS — shared by the forms via zodResolver
 * ==========================================================================*/
const email = z.string().min(1, "Email is required").email("Enter a valid email address");

// The backend enforces a minimum of 8 characters; mirror it here so the user
// gets instant feedback instead of a round-trip error.
const password = z.string().min(8, "Password must be at least 8 characters");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required"),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(60, "Name is too long"),
    email,
    password,
    passwordConfirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });
export type SignupValues = z.infer<typeof signupSchema>;

export const forgotSchema = z.object({ email });
export type ForgotValues = z.infer<typeof forgotSchema>;

export const resetSchema = z
  .object({
    password,
    passwordConfirm: z.string().min(1, "Please confirm your password"),
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });
export type ResetValues = z.infer<typeof resetSchema>;

/* ============================================================================
 * AUTH FUNCTIONS
 * ==========================================================================*/

/** Log in with email + password. On success the token is stored by `apiRaw`. */
export async function login(values: LoginValues): Promise<AuthUser | undefined> {
  const res = await apiRaw<AuthEnvelope>("/users/login", {
    method: "POST",
    body: values,
  });
  return res.data?.user;
}

/** Create an account. Backend wants `passwordConfirm`, which we send explicitly. */
export async function signup(values: SignupValues): Promise<AuthUser | undefined> {
  const res = await apiRaw<AuthEnvelope>("/users/signup", {
    method: "POST",
    body: {
      name: values.name,
      email: values.email,
      password: values.password,
      passwordConfirm: values.passwordConfirm,
    },
  });
  return res.data?.user;
}

/** Request a password-reset email. Never reveals whether the account exists. */
export async function forgotPassword(values: ForgotValues): Promise<void> {
  await apiRaw("/users/forgotPassword", { method: "POST", body: values });
}

/** Set a new password from a reset-link token. Backend logs the user in. */
export async function resetPassword(
  token: string,
  values: ResetValues,
): Promise<AuthUser | undefined> {
  const res = await apiRaw<AuthEnvelope>(`/users/resetPassword/${token}`, {
    method: "PATCH",
    body: { password: values.password, passwordConfirm: values.passwordConfirm },
  });
  return res.data?.user;
}

/** Best-effort logout: tell the server, then always clear the local token. */
export async function logout(): Promise<void> {
  try {
    await apiRaw("/users/logout");
  } catch {
    /* clearing the client session below is what actually matters */
  }
  setToken(null);
}

/** Return the current user if a valid session exists, else null. */
export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await apiRaw<AuthEnvelope>("/users/me");
    return res.data?.user ?? null;
  } catch {
    return null;
  }
}

/** Extract a friendly message from a thrown auth error. */
export function authErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

/** Only allow same-origin relative paths as a post-login redirect target. */
export function safeNext(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}
