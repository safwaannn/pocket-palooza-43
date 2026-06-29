import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Paisa" },
      { name: "description", content: "Why we built Paisa, a calm personal finance tracker for everyday spending." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/"><BrandMark /></Link>
          <Link to="/auth"><Button size="sm">Sign in</Button></Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h1 className="text-4xl font-semibold tracking-tight mb-4">About Paisa</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Paisa is a calm, opinionated personal finance tracker. We believe most money apps
            try too hard — too many charts, too many tabs, too many notifications. Paisa keeps
            it simple: log income and expenses, set monthly budgets, and learn from clear
            reports.
          </p>
          <h2 className="text-2xl font-semibold mt-12 mb-3">Our principles</h2>
          <ul className="space-y-3 text-muted-foreground">
            <li>• Clarity over cleverness — every number should answer a question.</li>
            <li>• Private by default — your data belongs to you.</li>
            <li>• Honest defaults — sensible categories, no upsell pressure.</li>
            <li>• Built for India — rupee-first, month-first.</li>
          </ul>
        </section>
      </main>
      <Footer />
    </div>
  );
}
