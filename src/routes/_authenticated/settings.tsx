import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { LogOut, User, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, DEFAULT_CURRENCY } from "@/lib/currency";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Paisa" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("id,name,currency,created_at")
        .eq("id", userData.user.id)
        .single();
      if (error) throw error;
      return { ...data, email: userData.user.email ?? "" };
    },
  });

  useEffect(() => {
    if (profile?.name) setName(profile.name);
    if (profile?.currency) setCurrency(profile.currency);
  }, [profile?.name, profile?.currency]);

  const updateName = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("No profile");
      const { error } = await supabase
        .from("profiles")
        .update({ name: name.trim() || null })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCurrency = useMutation({
    mutationFn: async (next: string) => {
      if (!profile) throw new Error("No profile");
      const { error } = await supabase
        .from("profiles")
        .update({ currency: next })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Currency updated");
      // Invalidate anywhere money is shown so the new symbol propagates.
      qc.invalidateQueries({ queryKey: ["profile"] });
      qc.invalidateQueries({ queryKey: ["profile", "currency"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="pb-2">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary mb-1">Account</p>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-gradient-brand">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your profile and session.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Profile
            </CardTitle>
            <CardDescription>Update your display name and view account info.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input id="email" value={profile?.email ?? ""} disabled />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              )}
            </div>
            <div className="flex justify-end">
              <Button
                onClick={() => updateName.mutate()}
                disabled={updateName.isPending || isLoading}
              >
                {updateName.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" /> Currency
            </CardTitle>
            <CardDescription>
              All amounts across dashboards, budgets and reports use this currency.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Preferred currency</Label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select
                  value={currency}
                  onValueChange={(next) => {
                    setCurrency(next);
                    updateCurrency.mutate(next);
                  }}
                >
                  <SelectTrigger id="currency" aria-label="Preferred currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} &nbsp; {c.code} — {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Session</CardTitle>
            <CardDescription>Sign out of this device.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={signOut} className="gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
