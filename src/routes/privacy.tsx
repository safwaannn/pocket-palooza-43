import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { Footer } from "@/components/Footer";
import { Lock, Database, Share2, Trash2 } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Paisa" },
      { name: "description", content: "How Paisa handles your personal finance data." },
    ],
  }),
  component: PrivacyPage,
});

const sections = [
  { icon: Database, title: "Data we store", body: "Only what you enter: account email, display name, transactions, categories, and budgets. We do not access bank accounts." },
  { icon: Lock, title: "How it's stored", body: "Your data lives in a managed Postgres database protected by row-level security. Only you can read your rows." },
  { icon: Share2, title: "Sharing", body: "We do not sell or share your data. We do not run advertising. Period." },
  { icon: Trash2, title: "Deletion", body: "Email us to request account deletion and we will remove all your rows within 7 days." },
];

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <header className="border-b bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link to="/"><BrandMark /></Link>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-2">Legal</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-2 text-gradient-brand">Privacy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>

        <div className="space-y-4">
          {sections.map((s) => (
            <div key={s.title} className="rounded-2xl border bg-card p-6 flex gap-4">
              <div className="h-10 w-10 shrink-0 rounded-lg bg-accent flex items-center justify-center">
                <s.icon className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg mb-1">{s.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
