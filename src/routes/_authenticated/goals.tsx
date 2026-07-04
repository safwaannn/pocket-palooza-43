import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Target,
  Plus,
  Trash2,
  Pencil,
  Trophy,
  Wallet,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
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

function daysUntil(date?: string): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

type FormState = { name: string; target: string; saved: string; deadline: string };
const emptyForm: FormState = { name: "", target: "", saved: "", deadline: "" };

function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [contributeId, setContributeId] = useState<string | null>(null);
  const [contributeAmt, setContributeAmt] = useState("");

  useEffect(() => setGoals(loadGoals()), []);

  const persist = (next: Goal[]) => {
    setGoals(next);
    saveGoals(next);
  };

  const stats = useMemo(() => {
    const totalTarget = goals.reduce((s, g) => s + g.target, 0);
    const totalSaved = goals.reduce((s, g) => s + g.saved, 0);
    const completed = goals.filter((g) => g.saved >= g.target).length;
    return { totalTarget, totalSaved, completed };
  }, [goals]);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditingId(g.id);
    setForm({
      name: g.name,
      target: String(g.target),
      saved: String(g.saved),
      deadline: g.deadline ?? "",
    });
    setDialogOpen(true);
  };

  const submit = () => {
    if (!form.name.trim() || !form.target) {
      toast.error("Name and target are required");
      return;
    }
    const target = Number(form.target);
    const saved = Number(form.saved || 0);
    if (target <= 0) return toast.error("Target must be greater than zero");

    if (editingId) {
      persist(
        goals.map((g) =>
          g.id === editingId
            ? { ...g, name: form.name.trim(), target, saved, deadline: form.deadline || undefined }
            : g,
        ),
      );
      toast.success("Goal updated");
    } else {
      const g: Goal = {
        id: crypto.randomUUID(),
        name: form.name.trim(),
        target,
        saved,
        deadline: form.deadline || undefined,
      };
      persist([g, ...goals]);
      toast.success("Goal added");
    }
    setDialogOpen(false);
    setForm(emptyForm);
    setEditingId(null);
  };

  const remove = (id: string) => {
    persist(goals.filter((g) => g.id !== id));
    toast.success("Goal deleted");
    setConfirmDeleteId(null);
  };

  const adjustSaved = (id: string, delta: number) =>
    persist(
      goals.map((g) =>
        g.id === id ? { ...g, saved: Math.min(g.target, Math.max(0, g.saved + delta)) } : g,
      ),
    );

  const applyContribution = () => {
    const amt = Number(contributeAmt);
    if (!contributeId || !amt || amt <= 0) return toast.error("Enter a valid amount");
    adjustSaved(contributeId, amt);
    toast.success(`Added ${formatINR(amt)}`);
    setContributeId(null);
    setContributeAmt("");
  };

  return (
    <AppShell title="Goals">
      <PageHeader
        title="Savings goals"
        description="Track what you're saving toward — a trip, a gadget, an emergency fund."
        actions={
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" /> New goal
          </Button>
        }
      />

      {goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <StatCard
            label="Total saved"
            value={formatINR(stats.totalSaved)}
            icon={Wallet}
            tone="success"
            hint={`of ${formatINR(stats.totalTarget)}`}
          />
          <StatCard
            label="Active goals"
            value={String(goals.length - stats.completed)}
            icon={Target}
            hint={`${goals.length} total`}
          />
          <StatCard
            label="Completed"
            value={String(stats.completed)}
            icon={Trophy}
            tone="warning"
          />
        </div>
      )}

      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set a target and start tracking your progress toward it."
          action={
            <Button onClick={openNew} className="gap-2">
              <Plus className="h-4 w-4" /> Create your first goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const pct = Math.min(100, (g.saved / g.target) * 100);
            const remaining = Math.max(0, g.target - g.saved);
            const days = daysUntil(g.deadline);
            const isDone = g.saved >= g.target;
            const isOverdue = days !== null && days < 0 && !isDone;

            return (
              <Card
                key={g.id}
                className="overflow-hidden transition-colors hover:border-primary/35"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">{g.name}</h3>
                        {isDone && (
                          <Badge className="bg-[color:var(--success)]/15 text-[color:var(--success)] hover:bg-[color:var(--success)]/15 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Done
                          </Badge>
                        )}
                        {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                      </div>
                      {g.deadline && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <CalendarClock className="h-3 w-3" />
                          {new Date(g.deadline).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                          {days !== null && !isDone && (
                            <span className="ml-1">
                              · {days >= 0 ? `${days}d left` : `${-days}d ago`}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(g)}
                        aria-label="Edit goal"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setConfirmDeleteId(g.id)}
                        aria-label="Delete goal"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Saved</p>
                        <p className="finance-figure text-2xl font-semibold">
                          {formatINR(g.saved)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="finance-figure text-xl font-semibold">
                          {formatINR(g.target)}
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <Progress value={pct} className="h-3" aria-label={`${g.name} progress`} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] font-semibold leading-none drop-shadow-sm">
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span
                        className={`font-medium ${
                          isDone
                            ? "text-[color:var(--success)]"
                            : pct >= 80
                              ? "text-[color:var(--warning)]"
                              : "text-muted-foreground"
                        }`}
                      >
                        {isDone
                          ? "Goal reached"
                          : pct >= 80
                            ? "Almost there"
                            : `${formatINR(remaining)} to go`}
                      </span>
                      <span className="text-muted-foreground">
                        {formatINR(g.saved)} / {formatINR(g.target)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustSaved(g.id, 500)}
                      disabled={isDone}
                    >
                      +₹500
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustSaved(g.id, 1000)}
                      disabled={isDone}
                    >
                      +₹1,000
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setContributeId(g.id);
                        setContributeAmt("");
                      }}
                      disabled={isDone}
                    >
                      Custom
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => adjustSaved(g.id, -500)}
                      disabled={g.saved === 0}
                    >
                      −₹500
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit goal" : "New savings goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Goa trip"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Target (₹)</Label>
                <Input
                  type="number"
                  value={form.target}
                  onChange={(e) => setForm({ ...form, target: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Saved (₹)</Label>
                <Input
                  type="number"
                  value={form.saved}
                  onChange={(e) => setForm({ ...form, saved: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline (optional)</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submit}>{editingId ? "Save changes" : "Add goal"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom contribution dialog */}
      <Dialog open={contributeId !== null} onOpenChange={(o) => !o && setContributeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Amount (₹)</Label>
            <Input
              type="number"
              autoFocus
              value={contributeAmt}
              onChange={(e) => setContributeAmt(e.target.value)}
              placeholder="2000"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setContributeId(null)}>
              Cancel
            </Button>
            <Button onClick={applyContribution}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(o) => !o && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this goal?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the goal and its saved progress. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDeleteId && remove(confirmDeleteId)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
