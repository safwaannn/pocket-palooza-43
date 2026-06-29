import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy — Paisa" },
      { name: "description", content: "How Paisa handles your personal finance data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link to="/"><BrandMark /></Link>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-3xl px-6 py-16 prose-sm">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Privacy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>

        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Data we store</h2>
            <p>Only what you enter: account email, display name, transactions, categories, and budgets. We do not access bank accounts.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">How it's stored</h2>
            <p>Your data is stored in a managed Postgres database protected by row-level security. Only you can read your rows.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Sharing</h2>
            <p>We do not sell or share your data. We do not run advertising. Period.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-2">Deletion</h2>
            <p>Email us to request account deletion and we will remove all your rows within 7 days.</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
