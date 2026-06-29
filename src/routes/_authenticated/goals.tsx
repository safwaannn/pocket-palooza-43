import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Target, Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({ meta: [{ title: "Goals — Paisa" }] }),
  component: GoalsPage,
});

type Goal = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline?: string;
};

const STORAGE_KEY = "paisa.goals.v1";

function loadGoals(): Goal[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveGoals(goals: Goal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
}

function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [saved, setSaved] = useState("");
  const [deadline, setDeadline] = useState("");

  useEffect(() => setGoals(loadGoals()), []);

  const persist = (next: Goal[]) => {
    setGoals(next);
    saveGoals(next);
  };

  const addGoal = () => {
    if (!name.trim() || !target) return toast.error("Name and target required");
    const g: Goal = {
      id: crypto.randomUUID(),
      name: name.trim(),
      target: Number(target),
      saved: Number(saved || 0),
      deadline: deadline || undefined,
    };
    persist([g, ...goals]);
    setName(""); setTarget(""); setSaved(""); setDeadline("");
    setOpen(false);
    toast.success("Goal added");
  };

  const remove = (id: string) => persist(goals.filter((g) => g.id !== id));

  const updateSaved = (id: string, delta: number) =>
    persist(goals.map((g) => (g.id === id ? { ...g, saved: Math.max(0, g.saved + delta) } : g)));

  return (
    <AppShell title="Goals">
      <PageHeader
        title="Savings goals"
        description="Track what you're saving toward — a trip, a gadget, an emergency fund."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="h-4 w-4" /> New goal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New savings goal</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa trip" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Target (₹)</Label>
                    <Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Already saved (₹)</Label>
                    <Input type="number" value={saved} onChange={(e) => setSaved(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Deadline (optional)</Label>
                  <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addGoal}>Add goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set a target and start tracking your progress."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const pct = Math.min(100, (g.saved / g.target) * 100);
            return (
              <Card key={g.id}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{g.name}</h3>
                      {g.deadline && (
                        <p className="text-xs text-muted-foreground">
                          by {new Date(g.deadline).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => remove(g.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Progress value={pct} />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {formatINR(g.saved)} of {formatINR(g.target)}
                    </span>
                    <span className="font-medium">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => updateSaved(g.id, 500)}>
                      +₹500
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => updateSaved(g.id, 1000)}>
                      +₹1,000
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => updateSaved(g.id, -500)}>
                      −₹500
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
