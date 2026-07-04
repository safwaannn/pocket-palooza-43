import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms — Paisa" },
      { name: "description", content: "Terms of service for using Paisa." },
    ],
  }),
  component: TermsPage,
});

const clauses = [
  { title: "Personal use", body: "By using Paisa you agree to use the service for personal, non-commercial finance tracking." },
  { title: "As-is service", body: "Paisa is provided \"as is\" without warranty. We do our best to keep your data safe, but you should keep your own backups of any critical records." },
  { title: "Stopping the service", body: "You can stop using Paisa at any time. We can suspend accounts that abuse the service." },
  { title: "Questions", body: "Reach out via the Help page and we'll get back to you." },
];

function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-hero">
      <header className="border-b bg-background/60 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link to="/"><BrandMark /></Link>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-16">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary mb-2">Legal</p>
        <h1 className="font-display text-4xl font-semibold tracking-tight mb-2 text-gradient-brand">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: June 2026</p>
        <ol className="space-y-4">
          {clauses.map((c, i) => (
            <li key={c.title} className="rounded-2xl border bg-card p-6 flex gap-4">
              <span className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-primary to-primary-glow text-primary-foreground font-display font-semibold flex items-center justify-center shadow-glow">
                {i + 1}
              </span>
              <div>
                <h2 className="font-display font-semibold text-lg mb-1">{c.title}</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </div>
  );
}
