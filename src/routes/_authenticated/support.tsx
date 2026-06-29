import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { LifeBuoy, Mail, BookOpen } from "lucide-react";

export const Route = createFileRoute("/_authenticated/help")({
  head: () => ({ meta: [{ title: "Help — Paisa" }] }),
  component: InAppHelp,
});

const faqs = [
  { q: "How do I edit a transaction?", a: "Open Transactions, find the row, and click the pencil icon." },
  { q: "How do I delete a category?", a: "Categories → click the trash icon next to your custom category. Default categories can't be deleted." },
  { q: "Why is a budget showing red?", a: "It means you've crossed 100% of your monthly limit for that category." },
  { q: "Can I export my data?", a: "Yes — the Transactions page has an Export CSV button." },
  { q: "How do I reset my password?", a: "Sign out and use the Sign in page to request a reset (coming soon)." },
];

function InAppHelp() {
  return (
    <AppShell title="Help">
      <PageHeader title="Need a hand?" description="Quick answers and ways to reach us." />

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <Card><CardContent className="p-5 flex items-center gap-3">
          <BookOpen className="h-5 w-5 text-primary" />
          <div><p className="font-medium">Guides</p><p className="text-xs text-muted-foreground">Quick walkthroughs</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3">
          <LifeBuoy className="h-5 w-5 text-primary" />
          <div><p className="font-medium">Status</p><p className="text-xs text-muted-foreground">All systems normal</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-5 flex items-center gap-3">
          <Mail className="h-5 w-5 text-primary" />
          <div><p className="font-medium">Email us</p><p className="text-xs text-muted-foreground">hello@paisa.app</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-2">
          <Accordion type="single" collapsible>
            {faqs.map((f, i) => (
              <AccordionItem key={i} value={`q-${i}`}>
                <AccordionTrigger className="px-4 text-left">{f.q}</AccordionTrigger>
                <AccordionContent className="px-4 text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </AppShell>
  );
}
