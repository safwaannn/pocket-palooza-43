export const APP_ROLES = ["viewer", "user", "manager", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type Permission =
  | "admin:access"
  | "roles:manage"
  | "transactions:write"
  | "transactions:export"
  | "categories:write"
  | "budgets:write"
  | "recurring:write"
  | "calendar:view";

export const ROLE_META: Record<
  AppRole,
  { label: string; description: string; tone: "default" | "secondary" | "outline" }
> = {
  admin: {
    label: "Admin",
    description: "Can manage roles and view platform-wide finance totals.",
    tone: "default",
  },
  manager: {
    label: "Manager",
    description: "Can manage their own transactions, budgets, categories, and schedules.",
    tone: "secondary",
  },
  user: {
    label: "User",
    description: "Can work with their own finance data.",
    tone: "outline",
  },
  viewer: {
    label: "Viewer",
    description: "Can view finance data but cannot make changes.",
    tone: "outline",
  },
};

const ROLE_RANK: Record<AppRole, number> = {
  viewer: 0,
  user: 1,
  manager: 2,
  admin: 3,
};

const ROLE_PERMISSIONS: Record<AppRole, Permission[]> = {
  viewer: ["calendar:view"],
  user: [
    "transactions:write",
    "transactions:export",
    "categories:write",
    "budgets:write",
    "recurring:write",
    "calendar:view",
  ],
  manager: [
    "transactions:write",
    "transactions:export",
    "categories:write",
    "budgets:write",
    "recurring:write",
    "calendar:view",
  ],
  admin: [
    "admin:access",
    "roles:manage",
    "transactions:write",
    "transactions:export",
    "categories:write",
    "budgets:write",
    "recurring:write",
    "calendar:view",
  ],
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && APP_ROLES.includes(value as AppRole);
}

export function normalizeRoles(values: unknown[]): AppRole[] {
  const roles = values.filter(isAppRole);
  return roles.length ? roles : ["viewer"];
}

export function primaryRole(roles: AppRole[]): AppRole {
  return [...roles].sort((a, b) => ROLE_RANK[b] - ROLE_RANK[a])[0] ?? "viewer";
}

export function hasPermission(roles: AppRole[], permission: Permission): boolean {
  return roles.some((role) => ROLE_PERMISSIONS[role].includes(permission));
}

export function roleOptions(): AppRole[] {
  return [...APP_ROLES].reverse();
}
