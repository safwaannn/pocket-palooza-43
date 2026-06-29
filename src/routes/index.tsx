import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  TrendingUp,
  Target,
  PieChart,
  Bell,
  Tags,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paisa — Personal Finance Tracker" },
      {
        name: "description",
        content:
          "Track income, expenses, budgets, and visual reports — a clean, modern personal finance tracker.",
      },
      { property: "og:title", content: "Paisa — Personal Finance Tracker" },
      {
        property: "og:description",
        content: "Log transactions, set budgets, and watch your money with clarity.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSignedIn(!!s));
    return () => data.subscription.unsubscribe();
  }, []);

  const ctaTo = signedIn ? "/dashboard" : "/auth";
  const ctaLabel = signedIn ? "Open dashboard" : "Get started free";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Paisa</span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 0%, color-mix(in oklab, var(--primary) 25%, transparent), transparent 70%)",
          }}
        />
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Smart budgets · instant alerts · clean reports
            </div>
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Take control of your money,
              <span className="block bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                one rupee at a time.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
              Paisa helps you log income & expenses, set category budgets, and see
              exactly where your money goes — with alerts before you overspend.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to={ctaTo}>
                  {ctaLabel} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">See features</a>
              </Button>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" /> Private by default · Your data, your account
            </div>
          </div>

          {/* Preview card */}
          <div className="mx-auto mt-14 max-w-4xl">
            <div className="rounded-2xl border bg-card p-4 shadow-2xl shadow-primary/10 md:p-6">
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { label: "Income", value: "₹85,000", tone: "text-success" },
                  { label: "Expenses", value: "₹42,310", tone: "text-destructive" },
                  { label: "Balance", value: "₹42,690", tone: "text-primary" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border bg-background p-4">
                    <div className="text-xs uppercase text-muted-foreground">{s.label}</div>
                    <div className={`mt-1 text-2xl font-semibold ${s.tone}`}>{s.value}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid gap-3">
                {[
                  { name: "Food", pct: 62, used: "₹6,200 / ₹10,000" },
                  { name: "Rent", pct: 100, used: "₹20,000 / ₹20,000" },
                  { name: "Travel", pct: 84, used: "₹4,200 / ₹5,000" },
                ].map((b) => (
                  <div key={b.name} className="rounded-xl border bg-background p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="font-medium">{b.name}</span>
                      <span
                        className={
                          b.pct >= 100
                            ? "text-destructive"
                            : b.pct >= 80
                              ? "text-warning-foreground"
                              : "text-muted-foreground"
                        }
                      >
                        {b.used}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full ${b.pct >= 100 ? "bg-destructive" : b.pct >= 80 ? "bg-warning" : "bg-primary"}`}
                        style={{ width: `${Math.min(100, b.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Everything you need to manage money
            </h2>
            <p className="mt-3 text-muted-foreground">
              Built for clarity. Designed for daily use.
            </p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: TrendingUp, title: "Track income & expenses", desc: "Add transactions in seconds with smart categories." },
              { icon: Tags, title: "Custom categories", desc: "Use built-in categories or create your own." },
              { icon: Target, title: "Monthly budgets", desc: "Set limits per category and stay on track." },
              { icon: Bell, title: "Smart alerts", desc: "Get notified at 80% and 100% of every budget." },
              { icon: PieChart, title: "Visual reports", desc: "Pie & bar charts reveal spending patterns." },
              { icon: ShieldCheck, title: "Private & secure", desc: "Row-level security keeps your data yours." },
            ].map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border bg-background p-6 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-20 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Start in three steps
            </h2>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { n: "01", title: "Create your account", desc: "Sign up with email or Google in one tap." },
              { n: "02", title: "Set budgets", desc: "Pick categories and monthly limits that fit your life." },
              { n: "03", title: "Log & learn", desc: "Add transactions and watch reports update instantly." },
            ].map((s) => (
              <div key={s.n} className="rounded-2xl border bg-card p-6">
                <div className="text-sm font-semibold text-primary">{s.n}</div>
                <h3 className="mt-2 text-lg font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t bg-card/30">
        <div className="mx-auto max-w-3xl px-4 py-20 md:px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
            Questions, answered
          </h2>
          <div className="mt-10 space-y-4">
            {[
              { q: "Is Paisa free?", a: "Yes — all core features are free while in beta." },
              { q: "Can I import bank statements?", a: "Manual entry today. CSV import is on the roadmap." },
              { q: "How do alerts work?", a: "You'll get an in-app notification when a category hits 80% and 100% of its monthly limit." },
              { q: "Is my data private?", a: "Yes. Each user can only access their own transactions via row-level security." },
            ].map((item) => (
              <div key={item.q} className="rounded-xl border bg-background p-5">
                <div className="font-medium">{item.q}</div>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center md:px-6">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
            Ready to see where your money goes?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Join Paisa and take the guesswork out of your finances.
          </p>
          <div className="mt-8">
            <Button asChild size="lg" className="gap-2">
              <Link to={ctaTo}>
                {ctaLabel} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground md:flex-row md:px-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span>© {new Date().getFullYear()} Paisa</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
            <Link to="/auth" className="hover:text-foreground">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

