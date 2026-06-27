import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCategories, type Transaction } from "@/lib/finance-queries";
import { toast } from "sonner";
import { Plus } from "lucide-react";

type Props = {
  trigger?: React.ReactNode;
  initial?: Transaction;
  onClose?: () => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
};

export function TransactionForm({ trigger, initial, open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const { data: categories = [] } = useCategories();
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const [type, setType] = useState<"income" | "expense">(initial?.type ?? "expense");
  const [amount, setAmount] = useState<string>(initial ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState<string>(initial?.category_id ?? "");
  const [date, setDate] = useState<string>(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState<string>(initial?.note ?? "");

  const filteredCats = categories.filter((c) => c.type === type);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Not signed in");
      const payload = {
        user_id: u.user.id,
        type,
        amount: Number(amount),
        category_id: categoryId || null,
        date,
        note: note || null,
      };
      if (initial) {
        const { error } = await supabase.from("transactions").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(initial ? "Transaction updated" : "Transaction added");
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      setOpen(false);
      if (!initial) {
        setAmount("");
        setNote("");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? "Edit transaction" : "Add transaction"}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!amount || Number(amount) <= 0) return toast.error("Enter a valid amount");
            if (!categoryId) return toast.error("Pick a category");
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => { setType(v as "income" | "expense"); setCategoryId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (₹)</Label>
              <Input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {filteredCats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}{c.user_id === null ? "" : " (custom)"}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Note (optional)</Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={255} />
          </div>
          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : initial ? "Update" : "Add transaction"}
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
