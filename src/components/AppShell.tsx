import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import {
  LayoutDashboard,
  Receipt,
  Tags,
  Target,
  PieChart,
  Bell,
  Settings,
  LogOut,
  Wallet,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import type { ReactNode } from "react";

const nav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/categories", label: "Categories", icon: Tags },
  { to: "/budgets", label: "Budgets", icon: Target },
  { to: "/alerts", label: "Alerts", icon: Bell, badgeKey: "alerts" as const },
  { to: "/reports", label: "Reports", icon: PieChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function useUnreadAlerts() {
  return useQuery({
    queryKey: ["budget-alerts", "unread-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("budget_alerts")
        .select("*", { count: "exact", head: true })
        .eq("acknowledged", false);
      if (error) return 0;
      return count ?? 0;
    },
    refetchOnWindowFocus: true,
  });
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: unread = 0 } = useUnreadAlerts();
  return (
    <nav className="flex flex-col gap-1">
      {nav.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.to;
        const showBadge = "badgeKey" in item && item.badgeKey === "alerts" && unread > 0;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
              active
                ? "bg-white/10 text-white shadow-glow"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            }`}
          >
            {active && (
              <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-primary" />
            )}
            <Icon className={`h-4 w-4 transition-colors ${active ? "text-primary-glow" : ""}`} />
            <span className="flex-1">{item.label}</span>
            {showBadge && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-semibold text-destructive-foreground">
                {unread}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const Brand = (
    <div className="flex items-center gap-2.5 px-4 py-5">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary shadow-glow">
        <Wallet className="h-5 w-5 text-primary-foreground" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold tracking-tight text-white">Paisa</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">Finance OS</span>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-gradient-sidebar text-white">
        {Brand}
        <div className="mt-2 flex-1 overflow-y-auto px-3">
          <NavList />
        </div>
        <div className="border-t border-white/10 p-3">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white"
            onClick={signOut}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-card/70 px-4 backdrop-blur-xl md:px-8">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-gradient-sidebar p-0 text-white border-r-0">
              {Brand}
              <div className="max-h-[calc(100vh-160px)] overflow-y-auto px-3">
                <NavList />
              </div>
              <div className="mt-4 border-t border-white/10 p-3">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <h1 className="font-display text-lg font-semibold tracking-tight">{title}</h1>
          <div className="ml-auto hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              ₹ INR
            </span>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
