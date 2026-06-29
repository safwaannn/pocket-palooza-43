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

function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center">
          <Link to="/"><BrandMark /></Link>
        </div>
      </header>
      <main className="flex-1 mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-4xl font-semibold tracking-tight mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>
        <div className="space-y-6 text-muted-foreground leading-relaxed">
          <p>By using Paisa you agree to use the service for personal, non-commercial finance tracking.</p>
          <p>Paisa is provided "as is" without warranty. We do our best to keep your data safe, but you should keep your own backups of any critical records.</p>
          <p>You can stop using Paisa at any time. We can suspend accounts that abuse the service.</p>
          <p>Questions? Reach out via the Help page.</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
