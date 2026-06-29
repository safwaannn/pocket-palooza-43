import { Link } from "@tanstack/react-router";
import { Wallet } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card/40">
      <div className="mx-auto max-w-6xl px-6 py-10 grid gap-6 sm:grid-cols-2 md:grid-cols-4 text-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <Wallet className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">Paisa</span>
          </div>
          <p className="text-muted-foreground text-xs">
            Personal finance, made calm.
          </p>
        </div>
        <div>
          <p className="font-medium mb-2">Product</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2">Company</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About</Link></li>
            <li><Link to="/help" className="hover:text-foreground">Help</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-medium mb-2">Legal</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Paisa. Built with care.
      </div>
    </footer>
  );
}
