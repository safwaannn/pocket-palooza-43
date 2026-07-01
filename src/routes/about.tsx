import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Sparkles, Shield, HeartHandshake, Coins } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Paisa" },
      { name: "description", content: "Why we built Paisa, a calm personal finance tracker for everyday spending." },
    ],
  }),
  component: AboutPage,
});

const principles = [
  { icon: Sparkles, title: "Clarity over cleverness", desc: "Every number should answer a question." },
  { icon: Shield, title: "Private by default", desc: "Your data belongs to you, always." },
  { icon: HeartHandshake, title: "Honest defaults", desc: "Sensible categories, no upsell pressure." },
  { icon: Coins, title: "Built for India", desc: "Rupee-first, month-first thinking." },
];

function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <header className="border-b bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link to="/"><BrandMark /></Link>
          <Link to="/auth"><Button size="sm">Sign in</Button></Link>
        </div>
      </header>
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-20 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-3">Our story</p>
          <h1 className="font-display text-5xl font-semibold tracking-tight mb-5 text-gradient-brand">
            About Paisa
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Paisa is a calm, opinionated personal finance tracker. Most money apps
            try too hard — too many charts, too many tabs, too many notifications.
            Paisa keeps it simple: log income and expenses, set monthly budgets, and
            learn from clear reports.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-24">
          <h2 className="font-display text-2xl font-semibold text-center mb-10">Our principles</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            {principles.map((p) => (
              <div key={p.title} className="rounded-2xl border bg-card p-6 shadow-sm hover:shadow-elegant transition-shadow">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-4 shadow-glow">
                  <p.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-1">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
