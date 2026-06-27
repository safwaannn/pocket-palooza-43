import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCategories } from "@/lib/finance-queries";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({ meta: [{ title: "Categories — Paisa" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [name, setName] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");

  const add = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const { error } = await supabase.from("categories").insert({
        user_id: u.user.id, name: name.trim(), type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category added");
      setName("");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const defaults = categories.filter((c) => c.user_id === null);
  const custom = categories.filter((c) => c.user_id !== null);

  return (
    <AppShell title="Categories">
      <Card className="mb-6">
        <CardHeader><CardTitle>Add custom category</CardTitle></CardHeader>
        <CardContent>
          <form
            className="flex flex-col md:flex-row gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!name.trim()) return toast.error("Enter a name");
              add.mutate();
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="cname">Name</Label>
              <Input id="cname" value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2 md:w-44">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="md:self-end" disabled={add.isPending}>
              <Plus className="h-4 w-4" /> Add
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Your custom categories</CardTitle></CardHeader>
          <CardContent>
            {custom.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
            <div className="divide-y">
              {custom.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{c.type}</div>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(c.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Default categories</CardTitle></CardHeader>
          <CardContent>
            <div className="divide-y">
              {defaults.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2.5">
                  <div className="font-medium">{c.name}</div>
                  <span className="text-xs text-muted-foreground capitalize">{c.type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
