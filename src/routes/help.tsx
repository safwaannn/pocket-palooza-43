import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Mail, LifeBuoy } from "lucide-react";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help — Paisa" },
      { name: "description", content: "Answers to common questions about using Paisa." },
    ],
  }),
  component: HelpPage,
});

const faqs = [
  { q: "How do I add a transaction?", a: "Go to Transactions and click 'Add transaction'. Pick income or expense, choose a category, enter the amount and date." },
  { q: "How are budgets calculated?", a: "Budgets are per category, per month. We sum every expense in that category for the selected month and compare it to your limit." },
  { q: "When do I get alerts?", a: "You get a warning when a category hits 80% of its monthly limit and again when it crosses 100%. Alerts also live on the Alerts page." },
  { q: "Can I create custom categories?", a: "Yes. Visit Categories and add as many as you need. You can also see the default starter categories there." },
  { q: "Is my data private?", a: "Yes. Row-level security ensures only you can read your own rows. See the Privacy page for details." },
];

const channels = [
  { icon: BookOpen, title: "Guides", desc: "Quick product walkthroughs." },
  { icon: LifeBuoy, title: "Status", desc: "All systems operational." },
  { icon: Mail, title: "hello@paisa.app", desc: "We reply within 24 hours." },
];

function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <header className="border-b bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link to="/"><BrandMark /></Link>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-2">Support</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-3 text-gradient-brand">Help & FAQ</h1>
        <p className="text-muted-foreground mb-10">Common questions about Paisa. Can't find an answer? Reach out.</p>

        <div className="grid gap-4 sm:grid-cols-3 mb-10">
          {channels.map((c) => (
            <Card key={c.title} className="hover:shadow-elegant transition-shadow">
              <CardContent className="p-5">
                <c.icon className="h-5 w-5 text-primary mb-3" />
                <p className="font-medium text-sm">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-2">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem value={`item-${i}`} key={i}>
                  <AccordionTrigger className="text-left px-4">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground px-4">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
