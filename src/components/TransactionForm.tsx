import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { detectBudgetAlerts } from "@/lib/budget-alerts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  invalidateMoneyViews,
  useCategories,
  type Transaction,
  type TransactionType,
} from "@/lib/finance-queries";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type Props = {
  trigger?: ReactNode;
  initial?: Transaction;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

const today = () => new Date().toISOString().slice(0, 10);

export function TransactionForm({ trigger, initial, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => undefined)) : setInternalOpen;

  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amount, setAmount] = useState(initial ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState(initial?.category_id ?? "");
  const [date, setDate] = useState(initial?.date ?? today());
  const [note, setNote] = useState(initial?.note ?? "");

  useEffect(() => {
    if (!isOpen) return;
    setType(initial?.type ?? "expense");
    setAmount(initial ? String(initial.amount) : "");
    setCategoryId(initial?.category_id ?? "");
    setDate(initial?.date ?? today());
    setNote(initial?.note ?? "");
  }, [initial, isOpen]);

  const filteredCats = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const payload = {
        user_id: userData.user.id,
        type,
        amount: Number(amount),
        category_id: categoryId,
        date,
        note: note.trim() || null,
      };

      if (initial) {
        const { error } = await supabase.from("transactions").update(payload).eq("id", initial.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase.from("transactions").insert(payload);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success(initial ? "Transaction updated" : "Transaction added");
      invalidateMoneyViews(qc);
      setOpen(false);
      if (!initial) {
        setAmount("");
        setCategoryId("");
        setNote("");
        setDate(today());
      }
      try {
        const fresh = await detectBudgetAlerts();
        fresh.forEach((a) =>
          a.threshold === 100
            ? toast.error(`${a.categoryName} is over budget this month`)
            : toast.warning(`${a.categoryName} has used 80% of its budget`),
        );
        if (fresh.length) qc.invalidateQueries({ queryKey: ["budget-alerts"] });
      } catch {
        /* non-fatal */
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
    if (!categoryId) return toast.error("Pick a category");
    if (!date) return toast.error("Pick a date");
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit transaction" : "Add transaction"}</DialogTitle>
          <DialogDescription>
            Record income and expenses with a category, date, and optional note.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="transaction-type">Type</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value as TransactionType);
                  setCategoryId("");
                }}
              >
                <SelectTrigger id="transaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="transaction-amount">Amount (INR)</Label>
              <Input
                id="transaction-amount"
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-category">Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="transaction-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCats.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                    {category.user_id === null ? "" : " (custom)"}
                  </SelectItem>
                ))}
                {filteredCats.length === 0 && (
                  <div className="px-2 py-2 text-sm text-muted-foreground">
                    Add a {type} category first.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-date">Date</Label>
            <Input
              id="transaction-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-note">Note</Label>
            <Textarea
              id="transaction-note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={255}
              placeholder="Optional"
            />
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : initial ? "Update transaction" : "Add transaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function QuickAddButton() {
  return (
    <TransactionForm
      trigger={
        <Button>
          <Plus className="h-4 w-4" /> Add transaction
        </Button>
      }
    />
  );
}
