import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import {
  hasPermission,
  normalizeRoles,
  primaryRole,
  type AppRole,
  type Permission,
} from "@/lib/rbac";

/**
 * Reads all roles for the signed-in user. The `user_roles` table is RLS-protected:
 * users can read their own roles, while admins can read everyone from the admin page.
 */
export function useUserRoles(): {
  roles: AppRole[];
  primaryRole: AppRole;
  isLoading: boolean;
  can: (permission: Permission) => boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["user-roles", "current"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<AppRole[]> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return ["viewer"];
      const { data: rows, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);
      if (error) return ["viewer"];
      return normalizeRoles((rows ?? []).map((row) => row.role));
    },
  });

  const roles = data ?? ["viewer"];

  return {
    roles,
    primaryRole: primaryRole(roles),
    isLoading,
    can: (permission) => hasPermission(roles, permission),
  };
}

export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { can, isLoading } = useUserRoles();
  return { isAdmin: can("admin:access"), isLoading };
}
