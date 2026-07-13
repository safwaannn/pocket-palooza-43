import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ShieldCheck, ShieldOff, Users } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { useCurrency } from "@/hooks/use-currency";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Paisa" }] }),
  component: AdminPage,
});

type AdminUserRow = {
  id: string;
  name: string | null;
  currency: string;
  created_at: string;
  isAdmin: boolean;
  transactionCount: number;
  totalIncome: number;
  totalExpense: number;
};

function AdminPage() {
  const { isAdmin, isLoading: isCheckingRole } = useIsAdmin();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { format } = useCurrency();

  // Bounce non-admins to their dashboard. Server-side RLS also blocks the queries below,
  // but redirecting keeps the UX friendly.
  useEffect(() => {
    if (!isCheckingRole && !isAdmin) {
      toast.error("Admin access required");
      navigate({ to: "/dashboard", replace: true });
    }
  }, [isAdmin, isCheckingRole, navigate]);

  const { data: rows = [], isLoading } = useQuery({
    enabled: isAdmin,
    queryKey: ["admin", "users"],
    queryFn: async (): Promise<AdminUserRow[]> => {
      // Admin RLS policies allow reading every profile/user_roles/transactions row.
      const [profiles, roles, txns] = await Promise.all([
        supabase.from("profiles").select("id,name,currency,created_at"),
        supabase.from("user_roles").select("user_id,role"),
        supabase.from("transactions").select("user_id,amount,type"),
      ]);
      if (profiles.error) throw profiles.error;
      if (roles.error) throw roles.error;
      if (txns.error) throw txns.error;

      const adminSet = new Set(
        (roles.data ?? []).filter((r) => r.role === "admin").map((r) => r.user_id),
      );

      // Aggregate transaction totals per user in one pass.
      const summary = new Map<
        string,
        { count: number; income: number; expense: number }
      >();
      (txns.data ?? []).forEach((t) => {
        const s = summary.get(t.user_id) ?? { count: 0, income: 0, expense: 0 };
        s.count += 1;
        s[t.type as "income" | "expense"] += Number(t.amount);
        summary.set(t.user_id, s);
      });

      return (profiles.data ?? [])
        .map((p) => {
          const s = summary.get(p.id) ?? { count: 0, income: 0, expense: 0 };
          return {
            id: p.id,
            name: p.name,
            currency: p.currency ?? "INR",
            created_at: p.created_at,
            isAdmin: adminSet.has(p.id),
            transactionCount: s.count,
            totalIncome: s.income,
            totalExpense: s.expense,
          };
        })
        .sort((a, b) =>
          a.isAdmin === b.isAdmin
            ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            : Number(b.isAdmin) - Number(a.isAdmin),
        );
    },
  });

  const grantAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      if (error && error.code !== "23505") throw error; // 23505 = unique_violation
    },
    onSuccess: () => {
      toast.success("Admin role granted");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["user-role"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revokeAdmin = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Admin role revoked");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      qc.invalidateQueries({ queryKey: ["user-role"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isCheckingRole || !isAdmin) {
    return (
      <AppShell title="Admin">
        <Card>
          <CardContent className="p-10 text-center text-sm text-muted-foreground">
            {isCheckingRole ? "Checking permissions…" : "Redirecting…"}
          </CardContent>
        </Card>
      </AppShell>
    );
  }

  const totalUsers = rows.length;
  const totalAdmins = rows.filter((r) => r.isAdmin).length;
  const totalTxns = rows.reduce((n, r) => n + r.transactionCount, 0);

  return (
    <AppShell title="Admin">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryTile label="Users" value={String(totalUsers)} />
        <SummaryTile label="Admins" value={String(totalAdmins)} />
        <SummaryTile label="Transactions" value={String(totalTxns)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> User management
          </CardTitle>
          <CardDescription>
            Every registered user. Amounts are shown in your currency for comparison.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No users found.</p>
          ) : (
            <div className="divide-y divide-border">
              {rows.map((r) => (
                <div
                  key={r.id}
                  className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium">
                        {r.name ?? "Unnamed user"}
                      </span>
                      <Badge variant="outline">{r.currency}</Badge>
                      {r.isAdmin && (
                        <Badge className="bg-primary/15 text-primary">Admin</Badge>
                      )}
                    </div>
                    <div className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                      {r.id}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-right text-xs md:min-w-[380px]">
                    <div>
                      <div className="text-muted-foreground">Txns</div>
                      <div className="text-sm font-medium">
                        {r.transactionCount}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Income</div>
                      <div className="text-sm font-medium text-success">
                        {format(r.totalIncome)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Expense</div>
                      <div className="text-sm font-medium text-destructive">
                        {format(r.totalExpense)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {r.isAdmin ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => revokeAdmin.mutate(r.id)}
                        disabled={revokeAdmin.isPending}
                      >
                        <ShieldOff className="h-4 w-4" /> Revoke
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => grantAdmin.mutate(r.id)}
                        disabled={grantAdmin.isPending}
                      >
                        <ShieldCheck className="h-4 w-4" /> Make admin
                      </Button>
                    )}
                  </div>
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
