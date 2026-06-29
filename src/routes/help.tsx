import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { Footer } from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  {
    q: "How do I add a transaction?",
    a: "Go to Transactions and click 'Add transaction'. Pick income or expense, choose a category, enter the amount and date.",
  },
  {
    q: "How are budgets calculated?",
    a: "Budgets are per category, per month. We sum every expense in that category for the selected month and compare it to your limit.",
  },
  {
    q: "When do I get alerts?",
    a: "You get a warning when a category hits 80% of its monthly limit and again when it crosses 100%. Alerts also live on the Alerts page.",
  },
  {
    q: "Can I create custom categories?",
    a: "Yes. Visit Categories and add as many as you need. You can also see the default starter categories there.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Row-level security ensures only you can read your own rows. See the Privacy page for details.",
  },
];

function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link to="/"><BrandMark /></Link>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Help & FAQ</h1>
        <p className="text-muted-foreground mb-8">Common questions about Paisa.</p>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem value={`item-${i}`} key={i}>
              <AccordionTrigger className="text-left">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
}
