import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  hasPermission,
  normalizeRoles,
  primaryRole,
  type AppRole,
  type Permission,
} from "@/lib/rbac";

/**
 * Reads the current user's roles from GET /admin/me/roles (available to any
 * logged-in user). Falls back to ["viewer"] on error so the UI stays usable.
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
      try {
        const res = await api<{ roles: string[] }>("/admin/me/roles");
        return normalizeRoles(res?.roles ?? []);
      } catch {
        return ["viewer"];
      }
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
