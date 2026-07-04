import { createFileRoute, Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms - Paisa" },
      { name: "description", content: "Terms of service for using Paisa." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
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
        <p className="eyebrow">Legal</p>
        <h1 className="mb-2 mt-3 font-display text-5xl font-semibold tracking-normal">
          Terms of Service
        </h1>
        <p className="mb-8 text-sm text-muted-foreground">Last updated: June 2026</p>
        <div className="space-y-6 border-y border-border py-6 leading-relaxed text-muted-foreground">
          <p>
            By using Paisa you agree to use the service for personal, non-commercial finance
            tracking.
          </p>
          <p>
            Paisa is provided "as is" without warranty. We do our best to keep your data safe, but
            you should keep your own backups of any critical records.
          </p>
          <p>
            You can stop using Paisa at any time. We can suspend accounts that abuse the service.
          </p>
          <p>Questions? Reach out via the Help page.</p>
        </div>
      </main>
    </div>
  );
}
