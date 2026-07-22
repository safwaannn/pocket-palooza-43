import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { materializeRecurring } from "@/lib/recurring-materializer";
import { invalidateMoneyViews } from "@/lib/finance-queries";
import { invalidateRecurring } from "@/lib/recurring-queries";
import { toast } from "sonner";
import { useUserRoles } from "@/hooks/use-is-admin";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const qc = useQueryClient();
  const { can, isLoading } = useUserRoles();
  const canMaterializeRecurring = can("recurring:write");

  // Client-side materializer: on first mount after sign-in we look for any due recurring
  // schedules and insert real transactions for them. Cheap enough to run every session — the
  // query is limited by RLS to the current user and returns an empty set on the happy path.
  useEffect(() => {
    if (isLoading || !canMaterializeRecurring) return;
    let cancelled = false;
    (async () => {
      try {
        const created = await materializeRecurring();
        if (!cancelled && created > 0) {
          invalidateMoneyViews(qc);
          invalidateRecurring(qc);
          toast.success(
            `Posted ${created} scheduled transaction${created === 1 ? "" : "s"}`,
          );
        }
      } catch (err) {
        // Non-fatal — the user can still use the app if a schedule fails.
        console.error("Recurring materializer failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canMaterializeRecurring, isLoading, qc]);

  return <Outlet />;
}
