import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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

  const rows: { key: keyof Prefs; label: string; desc: string }[] = [
    { key: "budgetWarn80", label: "Budget warning at 80%", desc: "Toast when a category nears its limit." },
    { key: "budgetOver100", label: "Budget over 100%", desc: "Toast when a category exceeds its limit." },
    { key: "monthlySummary", label: "Monthly summary", desc: "Recap of income, expenses, and savings." },
    { key: "weeklyDigest", label: "Weekly digest", desc: "Short weekly snapshot every Monday." },
    { key: "productUpdates", label: "Product updates", desc: "Occasional notes about new features." },
  ];

  return (
    <AppShell title="Notifications">
      <PageHeader title="Notification preferences" description="Pick what you want to be reminded about." />
      <Card>
        <CardHeader>
          <CardTitle>Alerts</CardTitle>
          <CardDescription>Stored locally for now — server-side delivery is rolling out.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {rows.map((r) => (
              <li key={r.key} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <Label className="font-medium">{r.label}</Label>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </div>
                <Switch checked={prefs[r.key]} onCheckedChange={(v) => update(r.key, v)} />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </AppShell>
  );
}
