import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { BrandMark } from "@/components/BrandMark";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Bell,
  PieChart,
  ShieldCheck,
  Tags,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paisa - Personal Finance Tracker" },
      {
        name: "description",
        content:
          "Track income, expenses, budgets, and visual reports with a quiet editorial finance interface.",
      },
      { property: "og:title", content: "Paisa - Personal Finance Tracker" },
      {
        property: "og:description",
        content: "Log transactions, set budgets, and understand your money with clarity.",
      },
    ],
  }),
  component: Landing,
});

const previewStats = [
  { label: "Income", value: "INR 85,000", tone: "text-success" },
  { label: "Expenses", value: "INR 42,310", tone: "text-destructive" },
  { label: "Balance", value: "INR 42,690", tone: "text-primary" },
];

const previewBudgets = [
  { name: "Food", pct: 62, used: "INR 6,200 / INR 10,000" },
  { name: "Rent", pct: 100, used: "INR 20,000 / INR 20,000" },
  { name: "Travel", pct: 84, used: "INR 4,200 / INR 5,000" },
];

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  const ctaTo = signedIn ? "/dashboard" : "/auth";
  const ctaLabel = signedIn ? "Open dashboard" : "Start tracking";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" aria-label="Paisa home">
            <BrandMark />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#features" className="transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#workflow" className="transition-colors hover:text-foreground">
              Workflow
            </a>
            <a href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-border/80">
          <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
            <div className="max-w-3xl">
              <p className="eyebrow">Quiet Wealth Finance OS</p>
              <h1 className="mt-4 font-display text-6xl font-semibold leading-none tracking-normal sm:text-7xl md:text-8xl">
                Paisa
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                A personal finance workspace for tracking income, spending, budgets, and goals with
                calm editorial clarity.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="gap-2">
                  <Link to={ctaTo}>
                    {ctaLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href="#features">Explore features</a>
                </Button>
              </div>
            </div>

            <div className="mt-14 overflow-hidden rounded-lg border border-border bg-card/95 shadow-elegant">
              <div className="flex flex-col gap-4 border-b border-border p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="eyebrow">July statement</p>
                  <h2 className="mt-1 font-display text-2xl font-semibold">Household cashflow</h2>
                </div>
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-accent/40 bg-accent/15 px-3 py-1 text-xs font-semibold text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                  Private by default
                </div>
              </div>

              <div className="grid md:grid-cols-3">
                {previewStats.map((stat, index) => (
                  <div
                    key={stat.label}
                    className={`p-5 ${index > 0 ? "border-t border-border md:border-l md:border-t-0" : ""}`}
                  >
                    <p className="eyebrow">{stat.label}</p>
                    <p className={`finance-figure mt-2 text-4xl font-semibold ${stat.tone}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-border p-5">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">Budget watch</p>
                    <h3 className="mt-1 font-display text-xl font-semibold">
                      Categories at a glance
                    </h3>
                  </div>
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-4">
                  {previewBudgets.map((budget) => (
                    <div key={budget.name}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                        <span className="font-semibold">{budget.name}</span>
                        <span
                          className={
                            budget.pct >= 100
                              ? "text-destructive"
                              : budget.pct >= 80
                                ? "text-warning-foreground"
                                : "text-muted-foreground"
                          }
                        >
                          {budget.used}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={`h-full ${
                            budget.pct >= 100
                              ? "bg-destructive"
                              : budget.pct >= 80
                                ? "bg-warning"
                                : "bg-primary"
                          }`}
                          style={{ width: `${Math.min(100, budget.pct)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="border-b border-border/80 bg-card/45">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <div className="max-w-2xl">
              <p className="eyebrow">Finance essentials</p>
              <h2 className="mt-3 font-display text-4xl font-semibold">
                Everything important, arranged for daily review.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: TrendingUp,
                  title: "Track income and expenses",
                  desc: "Capture money movement quickly with clear categories.",
                },
                {
                  icon: Tags,
                  title: "Custom categories",
                  desc: "Shape your ledger around the way you actually spend.",
                },
                {
                  icon: Target,
                  title: "Monthly budgets",
                  desc: "Set limits and see progress before a category gets tight.",
                },
                {
                  icon: Bell,
                  title: "Budget alerts",
                  desc: "Know when spending reaches attention points.",
                },
                {
                  icon: PieChart,
                  title: "Visual reports",
                  desc: "Review category mix, cashflow, and monthly trends.",
                },
                {
                  icon: ShieldCheck,
                  title: "Private account data",
                  desc: "Your records stay scoped to your authenticated account.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/35"
                >
                  <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-md bg-accent/20 text-primary">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="workflow" className="border-b border-border/80">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[0.8fr_1.2fr] md:px-6">
            <div>
              <p className="eyebrow">Workflow</p>
              <h2 className="mt-3 font-display text-4xl font-semibold">A calmer money routine.</h2>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {[
                {
                  n: "01",
                  title: "Create your account",
                  desc: "Sign in and keep every record tied to your own profile.",
                },
                {
                  n: "02",
                  title: "Set budgets",
                  desc: "Choose category limits for the current month.",
                },
                {
                  n: "03",
                  title: "Log and review",
                  desc: "Add transactions and let reports, alerts, and totals update.",
                },
              ].map((step) => (
                <div key={step.n} className="grid gap-4 py-6 sm:grid-cols-[80px_1fr]">
                  <span className="finance-figure text-2xl font-semibold text-accent">
                    {step.n}
                  </span>
                  <div>
                    <h3 className="font-display text-xl font-semibold">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-card/45">
          <div className="mx-auto max-w-3xl px-4 py-16 md:px-6">
            <p className="eyebrow text-center">FAQ</p>
            <h2 className="mt-3 text-center font-display text-4xl font-semibold">
              Questions, answered.
            </h2>
            <div className="mt-10 divide-y divide-border border-y border-border">
              {[
                {
                  q: "Is Paisa free?",
                  a: "Yes, the core finance tracking workflow is available while in beta.",
                },
                {
                  q: "Can I import bank statements?",
                  a: "Manual entry is supported today. CSV import can be added later.",
                },
                {
                  q: "How do alerts work?",
                  a: "The app flags category budgets as they approach or cross their monthly limit.",
                },
                {
                  q: "Is my data private?",
                  a: "Each signed-in user can only access their own finance data.",
                },
              ].map((item) => (
                <div key={item.q} className="py-5">
                  <h3 className="font-display text-lg font-semibold">{item.q}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Button asChild size="lg" className="gap-2">
                <Link to={ctaTo}>
                  {ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
