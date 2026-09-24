import { useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Auth guard for every protected page — CLIENT-SIDE ONLY.
 *
 * The session lives in browser-only storage (httpOnly cookie + localStorage
 * bearer token), which the SSR server cannot see. So instead of a server-run
 * loader, we read the shared AuthProvider context. While it resolves we show
 * a spinner; once resolved, either render the page or redirect to /auth.
 */
export function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname)}`, { replace: true });
    }
  }, [loading, user, location.pathname, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="ml-2 text-sm">Loading your workspace...</span>
      </div>
    );
  }

  return <Outlet />;
}
