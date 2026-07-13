import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";

// Stub route — real admin panel is added in the next commit.
export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin — Paisa" }] }),
  component: AdminStub,
});

function AdminStub() {
  return (
    <AppShell title="Admin">
      <Card>
        <CardContent className="p-10 text-center text-sm text-muted-foreground">
          Admin panel is loading…
        </CardContent>
      </Card>
    </AppShell>
  );
}
