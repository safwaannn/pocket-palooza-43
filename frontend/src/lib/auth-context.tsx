import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  type AuthUser,
  type LoginValues,
  type SignupValues,
} from "@/lib/auth";

/**
 * ============================================================================
 * AUTH CONTEXT — the single client-side source of session truth
 * ============================================================================
 *
 * Why a context instead of a route `beforeLoad` guard:
 *   - In TanStack Start, `beforeLoad` runs on the SERVER during SSR, where the
 *     httpOnly cookie and the localStorage bearer token do NOT exist, so any
 *     session check there fails and bounces the user to /auth.
 *   - This provider runs entirely in the browser. It resolves the session once
 *     on mount and keeps it in React state, so guards and pages read a
 *     consistent, already-known value without server round-trips.
 *
 * signIn / signUp update `user` from the auth response IMMEDIATELY, so when a
 * page navigates to /dashboard right after, the guard already sees a user —
 * no race, no full-page reload needed.
 */

type AuthState = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (values: LoginValues) => Promise<AuthUser>;
  signUp: (values: SignupValues) => Promise<AuthUser>;
  signOut: () => Promise<void>;
  /** Re-fetch the current user (e.g. after a password reset in another tab). */
  refresh: () => Promise<AuthUser | null>;
  /** Directly set the user (used by the reset-password flow). */
  setUser: (user: AuthUser | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Resolve the session once on mount. In React StrictMode (dev only) this
  // effect runs twice — that's fine and intentional: the `cancelled` flag
  // is scoped per-run, so the first run's stale result is discarded and the
  // second run's request completes normally and updates state. (A `didInit`
  // ref guard here would be a bug: it would block the second run's fetch
  // while the first run's result is discarded, leaving `loading` stuck at
  // `true` forever.)
  useEffect(() => {
    let cancelled = false;
    getMe().then((u) => {
      if (cancelled) return;
      setUser(u);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (values: LoginValues) => {
    const u = await apiLogin(values);
    const resolved = u ?? (await getMe());
    setUser(resolved);
    return resolved as AuthUser;
  }, []);

  const signUp = useCallback(async (values: SignupValues) => {
    const u = await apiSignup(values);
    const resolved = u ?? (await getMe());
    setUser(resolved);
    return resolved as AuthUser;
  }, []);

  const signOut = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const u = await getMe();
    setUser(u);
    return u;
  }, []);

  const value = useMemo<AuthState>(
    () => ({ user, loading, signIn, signUp, signOut, refresh, setUser }),
    [user, loading, signIn, signUp, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
