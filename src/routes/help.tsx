import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help - Paisa" },
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/80 bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link to="/">
            <BrandMark />
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl flex-1 px-6 py-16">
        <p className="eyebrow">Support</p>
        <h1 className="mb-2 mt-3 font-display text-5xl font-semibold tracking-normal">
          Help & FAQ
        </h1>
        <p className="mb-8 text-muted-foreground">Common questions about Paisa.</p>
        <Accordion type="single" collapsible className="w-full border-y border-border">
          {faqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={faq.q}>
              <AccordionTrigger className="text-left font-display text-lg">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="leading-6 text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </div>
  );
}
