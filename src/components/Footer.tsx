import { Link } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-card/45">
      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-10 text-sm sm:grid-cols-2 md:grid-cols-4">
        <div>
          <BrandMark size="sm" />
          <p className="mt-3 text-xs text-muted-foreground">Personal finance, made calm.</p>
        </div>
        <div>
          <p className="mb-2 font-display font-semibold">Product</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link to="/" className="hover:text-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-display font-semibold">Company</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link to="/about" className="hover:text-foreground">
                About
              </Link>
            </li>
            <li>
              <Link to="/help" className="hover:text-foreground">
                Help
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-2 font-display font-semibold">Legal</p>
          <ul className="space-y-1.5 text-muted-foreground">
            <li>
              <Link to="/privacy" className="hover:text-foreground">
                Privacy
              </Link>
            </li>
            <li>
              <Link to="/terms" className="hover:text-foreground">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/80 py-4 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Paisa. Built with care.
      </div>
    </footer>
  );
}
