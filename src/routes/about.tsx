import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About - Paisa" },
      {
        name: "description",
        content: "Why we built Paisa, a calm personal finance tracker for everyday spending.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/80 bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/">
            <BrandMark />
          </Link>
          <Link to="/auth">
            <Button size="sm">Sign in</Button>
          </Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16">
          <p className="eyebrow">About</p>
          <h1 className="mb-4 mt-3 font-display text-5xl font-semibold tracking-normal">
            About Paisa
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Paisa is a calm, opinionated personal finance tracker. We believe most money apps try
            too hard - too many charts, too many tabs, too many notifications. Paisa keeps it
            simple: log income and expenses, set monthly budgets, and learn from clear reports.
          </p>
          <h2 className="mb-3 mt-12 font-display text-3xl font-semibold">Our principles</h2>
          <ul className="space-y-3 border-y border-border py-5 text-muted-foreground">
            <li>Clarity over cleverness - every number should answer a question.</li>
            <li>Private by default - your data belongs to you.</li>
            <li>Honest defaults - sensible categories, no upsell pressure.</li>
            <li>Built for India - rupee-first, month-first.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
