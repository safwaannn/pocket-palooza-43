import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bell, AlertTriangle, CalendarRange, Mail, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Paisa" }] }),
  component: NotificationsPage,
});

type Prefs = {
  budgetWarn80: boolean;
  budgetOver100: boolean;
  monthlySummary: boolean;
  weeklyDigest: boolean;
  productUpdates: boolean;
};

const KEY = "paisa.notifications.v1";
const defaults: Prefs = {
  budgetWarn80: true,
  budgetOver100: true,
  monthlySummary: true,
  weeklyDigest: false,
  productUpdates: false,
};

function NotificationsPage() {
  const [prefs, setPrefs] = useState<Prefs>(defaults);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPrefs({ ...defaults, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);

  const update = (k: keyof Prefs, v: boolean) => {
    const next = { ...prefs, [k]: v };
    setPrefs(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    toast.success("Preferences saved");
  };

  const rows: { key: keyof Prefs; label: string; desc: string; icon: typeof Bell }[] = [
    { key: "budgetWarn80", label: "Budget warning at 80%", desc: "Toast when a category nears its limit.", icon: Bell },
    { key: "budgetOver100", label: "Budget over 100%", desc: "Toast when a category exceeds its limit.", icon: AlertTriangle },
    { key: "monthlySummary", label: "Monthly summary", desc: "Recap of income, expenses, and savings.", icon: CalendarRange },
    { key: "weeklyDigest", label: "Weekly digest", desc: "Short weekly snapshot every Monday.", icon: Mail },
    { key: "productUpdates", label: "Product updates", desc: "Occasional notes about new features.", icon: Sparkles },
  ];

  return (
    <AppShell title="Notifications">
      <PageHeader
        eyebrow="Preferences"
        title="Notification preferences"
        description="Pick what you want to be reminded about."
      />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="font-display">Alerts</CardTitle>
          <CardDescription>Stored locally for now — server-side delivery is rolling out.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {rows.map((r) => {
              const Icon = r.icon;
              return (
                <li key={r.key} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 shrink-0 rounded-lg bg-accent flex items-center justify-center">
                      <Icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div>
                      <Label className="font-medium">{r.label}</Label>
                      <p className="text-sm text-muted-foreground">{r.desc}</p>
                    </div>
                  </div>
                  <Switch checked={prefs[r.key]} onCheckedChange={(v) => update(r.key, v)} />
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </AppShell>
  );
}
