import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  invalidateCategoryViews,
  useCategories,
  type Category,
  type TransactionType,
} from "@/lib/finance-queries";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({ meta: [{ title: "Categories - Paisa" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useCategories();
  const [name, setName] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [editing, setEditing] = useState<Category | null>(null);

  const hasDuplicate = (categoryName: string, categoryType: TransactionType, ignoredId?: string) =>
    categories.some(
      (category) =>
        category.id !== ignoredId &&
        category.type === categoryType &&
        category.name.toLowerCase() === categoryName.trim().toLowerCase(),
    );

  const add = useMutation({
    mutationFn: async () => {
      const trimmedName = name.trim();
      if (hasDuplicate(trimmedName, type)) throw new Error("That category already exists");

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");

      const { error } = await supabase.from("categories").insert({
        user_id: userData.user.id,
        name: trimmedName,
        type,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category added");
      setName("");
      invalidateCategoryViews(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const update = useMutation({
    mutationFn: async ({
      category,
      categoryName,
      categoryType,
    }: {
      category: Category;
      categoryName: string;
      categoryType: TransactionType;
    }) => {
      const trimmedName = categoryName.trim();
      if (hasDuplicate(trimmedName, categoryType, category.id)) {
        throw new Error("That category already exists");
      }

      const { error } = await supabase
        .from("categories")
        .update({ name: trimmedName, type: categoryType })
        .eq("id", category.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category updated");
      setEditing(null);
      invalidateCategoryViews(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category deleted");
      invalidateCategoryViews(qc);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const defaults = categories.filter((category) => category.user_id === null);
  const custom = categories.filter((category) => category.user_id !== null);
  const incomeCount = categories.filter((category) => category.type === "income").length;
  const expenseCount = categories.filter((category) => category.type === "expense").length;

  return (
    <AppShell title="Categories">
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <SummaryCard label="Total categories" value={String(categories.length)} />
        <SummaryCard label="Income categories" value={String(incomeCount)} />
        <SummaryCard label="Expense categories" value={String(expenseCount)} />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add custom category</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3 md:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!name.trim()) return toast.error("Enter a name");
              add.mutate();
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="category-name">Name</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={50}
                placeholder="Groceries, Rent, Bonus"
              />
            </div>
            <div className="space-y-2 md:w-44">
              <Label htmlFor="category-type">Type</Label>
              <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
                <SelectTrigger id="category-type">
                  <SelectValue />
                </SelectTrigger>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Your custom categories</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading categories...</p>
            ) : custom.length === 0 ? (
              <p className="text-sm text-muted-foreground">No custom categories yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {custom.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 py-3">
                    <CategoryLabel category={category} />
                    <div className="flex shrink-0 gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditing(category)}>
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit {category.name}</span>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete {category.name}</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Existing transactions will keep their amounts but lose this category.
                              Any budget for this category will also be removed.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => del.mutate(category.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {defaults.map((category) => (
                <div key={category.id} className="flex items-center justify-between py-3">
                  <CategoryLabel category={category} />
                  <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                    Built in
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {editing && (
        <CategoryEditDialog
          category={editing}
          open={true}
          pending={update.isPending}
          onOpenChange={(open) => !open && setEditing(null)}
          onSubmit={(categoryName, categoryType) =>
            update.mutate({ category: editing, categoryName, categoryType })
          }
        />
      )}
    </AppShell>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="eyebrow">{label}</div>
        <div className="finance-figure mt-2 text-3xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function CategoryLabel({ category }: { category: Category }) {
  return (
    <div className="min-w-0">
      <div className="truncate font-medium">{category.name}</div>
      <div className="mt-0.5 text-xs capitalize text-muted-foreground">{category.type}</div>
    </div>
  );
}

function CategoryEditDialog({
  category,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: {
  category: Category;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (name: string, type: TransactionType) => void;
}) {
  const [name, setName] = useState(category.name);
  const [type, setType] = useState<TransactionType>(category.type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit category</DialogTitle>
          <DialogDescription>
            Changes apply to future filters, reports, and transactions using this category.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!name.trim()) return toast.error("Enter a name");
            onSubmit(name, type);
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="edit-category-name">Name</Label>
            <Input
              id="edit-category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={50}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-category-type">Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as TransactionType)}>
              <SelectTrigger id="edit-category-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
