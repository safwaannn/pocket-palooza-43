import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Users } from "lucide-react";
import { useUserRoles } from "@/hooks/use-is-admin";
import { useCurrency } from "@/hooks/use-currency";
import { ROLE_META, primaryRole, roleOptions, type AppRole } from "@/lib/rbac";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin - Paisa" }] }),
  component: AdminPage,
});

type AdminUserRow = {
  id: string;
  name: string | null;
  currency: string;
  created_at: string;
  roles: AppRole[];
  primaryRole: AppRole;
  transactionCount: number;
  totalIncome: number;
  totalExpense: number;
};

function AdminPage() {
  const { can, isLoading: isCheckingRole } = useUserRoles();
  const canManageRoles = can("roles:manage");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { format } = useCurrency();

  useEffect(() => {
    if (!isCheckingRole && !canManageRoles) {
      toast.error("Admin access required");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [canManageRoles, isCheckingRole, navigate]);

  const { data: authUser } = useQuery({
    enabled: canManageRoles,
    queryKey: ["auth", "current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });

  const { data: rows = [], isLoading } = useQuery({
    enabled: canManageRoles,
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<AdminUserRow[]> => {
      const [profiles, roles, txns] = await Promise.all([
        supabase.from("profiles").select("id,name,currency,created_at"),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("transactions").select("user_id,amount,type"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      if (txns.error) throw txns.error;

      const rolesByUser = new Map<string, AppRole[]>();
      (roles.data ?? []).forEach((row) => {
        const role = row.role as AppRole;
        rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), role]);
      });

      const summary = new Map<string, { count: number; income: number; expense: number }>();
      (txns.data ?? []).forEach((transaction) => {
        const s = summary.get(transaction.user_id) ?? { count: 0, income: 0, expense: 0 };
        s.count += 1;
        s[transaction.type as "income" | "expense"] += Number(transaction.amount);
        summary.set(transaction.user_id, s);
      });

      return (profiles.data ?? [])
        .map((profile) => {
          const roles = rolesByUser.get(profile.id) ?? ["viewer"];
          const s = summary.get(profile.id) ?? { count: 0, income: 0, expense: 0 };
          return {
            id: profile.id,
            name: profile.name,
            currency: profile.currency ?? "INR",
            created_at: profile.created_at,
            roles,
            primaryRole: primaryRole(roles),
            transactionCount: s.count,
            totalIncome: s.income,
            totalExpense: s.expense,
          };
        })
        .sort((a, b) =>
          a.primaryRole === b.primaryRole
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : roleOptions().indexOf(a.primaryRole) - roleOptions().indexOf(b.primaryRole),
        );
    },
  });

  const setRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      if (authUser?.id === userId) {
        if (role !== "admin") {
          throw new Error("You cannot remove your own admin access");
        }
        return;
      }

      const { error: deleteError } = await supabase.from("user_roles").delete().eq("user_id", userId);
      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (insertError) throw insertError;
    },
    onSuccess: () => {
      toast.success("Role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["user-roles"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const roleCounts = useMemo(
    () =>
      roleOptions().map((role) => ({
        role,
        count: rows.filter((row) => row.primaryRole === role).length,
      })),
    [rows],
  );

  if (isCheckingRole || !canManageRoles) {
    return (
      <AppShell title="Admin">
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {isCheckingRole ? "Checking permissions..." : "Redirecting..."}
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const totalUsers = rows.length;
  const totalAdmins = rows.filter((row) => row.primaryRole === "admin").length;
  const totalReadOnly = rows.filter((row) => row.primaryRole === "viewer").length;
  const totalTxns = rows.reduce((n, row) => n + row.transactionCount, 0);

  return (
    <AppShell title="Admin">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryTile label="Users" value={String(totalUsers)} />
        <SummaryTile label="Admins" value={String(totalAdmins)} />
        <SummaryTile label="Viewers" value={String(totalReadOnly)} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" /> RBAC overview
          </CardTitle>
          <CardDescription>
            Assign one primary role per user. RLS enforces viewer read-only access for finance data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {roleCounts.map(({ role, count }) => (
              <div key={role} className="rounded-lg border border-border/70 p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={ROLE_META[role].tone}>{ROLE_META[role].label}</Badge>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {ROLE_META[role].description}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> User management
          </CardTitle>
          <CardDescription>
            Every registered user. {totalTxns} transactions are visible to admins for oversight.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">
                        {row.name ?? "Unnamed user"}
                      </span>
                      <Badge variant="outline">{row.currency}</Badge>
                      <Badge variant={ROLE_META[row.primaryRole].tone}>
                        {ROLE_META[row.primaryRole].label}
                      </Badge>
                    </div>
                    <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {row.id}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-right text-xs md:min-w-[380px]">
                    <div>
                      <div className="text-muted-foreground">Txns</div>
                      <div className="text-sm font-medium">{row.transactionCount}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Income</div>
                      <div className="text-sm font-medium text-success">
                        {format(row.totalIncome)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Expense</div>
                      <div className="text-sm font-medium text-destructive">
                        {format(row.totalExpense)}
                      </div>
                    </div>
                  </div>

                  <Select
                    value={row.primaryRole}
                    onValueChange={(role) =>
                      setRole.mutate({ userId: row.id, role: role as AppRole })
                    }
                    disabled={setRole.isPending}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions().map((role) => (
                        <SelectItem key={role} value={role}>
                          {ROLE_META[role].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="eyebrow">{label}</div>
        <div className="finance-figure mt-2 text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
