import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AlertTriangle, BellRing, Check, CheckCheck } from "lucide-react";
import { monthYearLabel } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({ meta: [{ title: "Alerts — Paisa" }] }),
  component: AlertsPage,
});

type AlertRow = {
  id: string;
  category_id: string;
  month_year: string;
  threshold: number;
  acknowledged: boolean;
  created_at: string;
  categories: { name: string } | null;
};

function AlertsPage() {
  const qc = useQueryClient();

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["budget-alerts"],
    queryFn: async (): Promise<AlertRow[]> => {
      const { data, error } = await supabase
        .from("budget_alerts")
        .select("id,category_id,month_year,threshold,acknowledged,created_at, categories(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AlertRow[];
    },
  });

  const ackOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("budget_alerts")
        .update({ acknowledged: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budget-alerts"] }),
  });

  const ackAll = useMutation({
    mutationFn: async () => {
      const ids = alerts.filter((a) => !a.acknowledged).map((a) => a.id);
      if (!ids.length) return;
      const { error } = await supabase
        .from("budget_alerts")
        .update({ acknowledged: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("All alerts marked read");
      qc.invalidateQueries({ queryKey: ["budget-alerts"] });
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, AlertRow[]>();
    alerts.forEach((a) => {
      const arr = map.get(a.month_year) ?? [];
      arr.push(a);
      map.set(a.month_year, arr);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [alerts]);

  const unread = alerts.filter((a) => !a.acknowledged).length;

  return (
    <AppShell title="Alerts">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            History of 80% and 100% budget threshold crossings.
          </p>
          {unread > 0 && (
            <p className="mt-1 text-sm font-medium text-warning-foreground">
              {unread} unread {unread === 1 ? "alert" : "alerts"}
            </p>
          )}
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={() => ackAll.mutate()} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <BellRing className="mx-auto h-10 w-10 text-muted-foreground/60" />
            <p className="mt-3 text-sm text-muted-foreground">
              No alerts yet. They'll show up here when a category crosses 80% or 100% of its budget.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([month, rows]) => (
            <Card key={month}>
              <CardHeader>
                <CardTitle>{monthYearLabel(month)}</CardTitle>
                <CardDescription>
                  {rows.length} {rows.length === 1 ? "alert" : "alerts"} this month
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                {rows.map((alert) => {
                  const over = alert.threshold === 100;
                  return (
                    <div
                      key={alert.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            over
                              ? "bg-destructive/10 text-destructive"
                              : "bg-warning/15 text-warning-foreground"
                          }`}
                        >
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="truncate">
                              {alert.categories?.name ?? "Category"}
                            </span>
                            <Badge variant={over ? "destructive" : "secondary"}>
                              {over ? "Over budget" : "80% used"}
                            </Badge>
                            {alert.acknowledged && (
                              <Badge variant="outline" className="text-xs">
                                Read
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </div>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => ackOne.mutate(alert.id)}
                          className="gap-1"
                        >
                          <Check className="h-4 w-4" /> Mark read
                        </Button>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  );
}
