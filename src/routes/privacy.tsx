import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy - Paisa" },
      { name: "description", content: "How Paisa handles your personal finance data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/80 bg-background/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
          <Link to="/">
            <BrandMark />
          </Link>
        </div>
      </header>
      <main className="prose-sm mx-auto max-w-3xl flex-1 px-6 py-16">
        <p className="eyebrow">Legal</p>
        <h1 className="mb-2 mt-3 font-display text-5xl font-semibold tracking-normal">Privacy</h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: June 2026</p>

        <div className="space-y-6 border-y border-border py-6 leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
              Data we store
            </h2>
            <p>
              Only what you enter: account email, display name, transactions, categories, and
              budgets. We do not access bank accounts.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">
              How it's stored
            </h2>
            <p>
              Your data is stored in a managed Postgres database protected by row-level security.
              Only you can read your rows.
            </p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">Sharing</h2>
            <p>We do not sell or share your data. We do not run advertising. Period.</p>
          </section>
          <section>
            <h2 className="mb-2 font-display text-2xl font-semibold text-foreground">Deletion</h2>
            <p>
              Email us to request account deletion and we will remove all your rows within 7 days.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
