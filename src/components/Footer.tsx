import { Link } from "@tanstack/react-router";
import { Wallet, Github, Twitter, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-gradient-to-b from-card/40 to-card/80">
      <div className="mx-auto max-w-6xl px-6 py-14 grid gap-8 sm:grid-cols-2 md:grid-cols-5 text-sm">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-semibold text-lg">Paisa</span>
          </div>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            Personal finance made calm. Track spending, set budgets, and stay in
            control — all in rupees.
          </p>
          <div className="flex items-center gap-3 mt-4 text-muted-foreground">
            <a href="#" aria-label="Twitter" className="hover:text-primary transition-colors"><Twitter className="h-4 w-4" /></a>
            <a href="#" aria-label="GitHub" className="hover:text-primary transition-colors"><Github className="h-4 w-4" /></a>
            <a href="mailto:hello@paisa.app" aria-label="Email" className="hover:text-primary transition-colors"><Mail className="h-4 w-4" /></a>
          </div>
        </div>
        <div>
          <p className="font-medium mb-3 text-xs uppercase tracking-wider text-muted-foreground">Product</p>
          <ul className="space-y-2">
            <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
            <li><Link to="/auth" className="hover:text-primary transition-colors">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-3 text-xs uppercase tracking-wider text-muted-foreground">Company</p>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
            <li><Link to="/help" className="hover:text-primary transition-colors">Help</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-3 text-xs uppercase tracking-wider text-muted-foreground">Legal</p>
          <ul className="space-y-2">
            <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-primary transition-colors">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Paisa. Crafted with care in India.
      </div>
    </footer>
  );
}
