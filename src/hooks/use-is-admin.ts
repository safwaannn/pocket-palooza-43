import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";

/**
 * Returns whether the current signed-in user has the `admin` role.
 * The check hits the `user_roles` table under RLS (users can read their own row), so it works
 * without exposing service-role credentials to the browser.
 * Cached for 60 s so nav badges and guards don't storm the DB.
 */
export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["user-role", "is-admin"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<boolean> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return false;
      const { data: rows, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id)
        .eq("role", "admin")
        .limit(1);
      if (error) return false;
      return (rows ?? []).length > 0;
    },
  });
  return { isAdmin: data ?? false, isLoading };
}
