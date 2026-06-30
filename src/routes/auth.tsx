import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { lovable } from "@/lib/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles, User, Wallet } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [{ title: "Sign in — Paisa" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { name },
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Account created. You're in!");
    navigate({ to: "/dashboard", replace: true });
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) return toast.error(result.error.message ?? "Google sign-in failed");
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email above first, then tap forgot password.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + "/auth",
    });
    if (error) return toast.error(error.message);
    toast.success("Password reset link sent. Check your inbox.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Soft animated background blobs */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[var(--color-primary-glow)]/30 blur-3xl" />
        <div className="absolute top-1/3 -right-24 h-96 w-96 rounded-full bg-[var(--color-chart-2)]/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-[var(--color-primary)]/15 blur-3xl" />
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left — brand panel (hidden on mobile) */}
        <aside className="relative hidden lg:flex flex-col justify-between p-12 bg-gradient-brand text-white overflow-hidden">
          <div className="absolute inset-0 opacity-30 mix-blend-overlay bg-[radial-gradient(circle_at_20%_10%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/30">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-semibold tracking-tight">Paisa</span>
          </div>

          <div className="relative z-10 space-y-6">
            <h2 className="font-display text-4xl xl:text-5xl font-semibold leading-tight tracking-tight">
              Your money,
              <br />
              in clear view.
            </h2>
            <p className="text-white/85 text-base max-w-md">
              Track every rupee, set smart budgets, and watch your savings grow — all in one calm,
              beautiful dashboard.
            </p>

            <ul className="space-y-3 pt-2">
              {[
                { icon: Sparkles, text: "AI-assisted budgeting & insights" },
                { icon: ShieldCheck, text: "Bank-grade encryption, always" },
                { icon: Wallet, text: "Income, expenses & investments — unified" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-white/90">
                  <span className="h-8 w-8 rounded-lg bg-white/15 ring-1 ring-white/25 flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-sm">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-white/70">
            © {new Date().getFullYear()} Paisa. Crafted with care.
          </p>
        </aside>

        {/* Right — auth form */}
        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            {/* Mobile brand header */}
            <div className="lg:hidden flex flex-col items-center mb-8">
              <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center mb-3 shadow-elegant">
                <Wallet className="h-7 w-7 text-primary-foreground" />
              </div>
              <h1 className="font-display text-3xl font-semibold tracking-tight">Paisa</h1>
              <p className="text-sm text-muted-foreground mt-1">Your money, in clear view.</p>
            </div>

            <div className="glass rounded-2xl p-7 sm:p-8 shadow-elegant">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-semibold tracking-tight">
                  {tab === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {tab === "signin"
                    ? "Sign in to continue to your dashboard."
                    : "Start tracking your finances in under a minute."}
                </p>
              </div>

              <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
                <TabsList className="grid grid-cols-2 mb-6 w-full">
                  <TabsTrigger value="signin">Sign in</TabsTrigger>
                  <TabsTrigger value="signup">Sign up</TabsTrigger>
                </TabsList>

                <TabsContent value="signin" className="mt-0">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <FieldEmail value={email} onChange={setEmail} id="email" />
                    <FieldPassword
                      id="password"
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggleShow={() => setShowPassword((s) => !s)}
                    />

                    <div className="flex justify-end -mt-1">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-soft"
                      disabled={loading}
                    >
                      {loading ? "Signing in…" : "Sign in"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="mt-0">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <FieldText
                      id="name"
                      label="Name"
                      icon={User}
                      placeholder="Jane Doe"
                      value={name}
                      onChange={setName}
                    />
                    <FieldEmail value={email} onChange={setEmail} id="email2" />
                    <FieldPassword
                      id="password2"
                      value={password}
                      onChange={setPassword}
                      show={showPassword}
                      onToggleShow={() => setShowPassword((s) => !s)}
                      helper="Any password works — easy, normal, or hard."
                    />

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-soft"
                      disabled={loading}
                    >
                      {loading ? "Creating…" : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="outline"
                className="w-full h-11 gap-2"
                onClick={handleGoogle}
                type="button"
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-6">
                By continuing you agree to our{" "}
                <a href="/terms" className="underline underline-offset-2 hover:text-primary">
                  Terms
                </a>{" "}
                and{" "}
                <a href="/privacy" className="underline underline-offset-2 hover:text-primary">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Reusable field components ---------- */

function FieldText({
  id,
  label,
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = "text",
  required = true,
}: {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground/80">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 pl-10 bg-card/60"
        />
      </div>
    </div>
  );
}

function FieldEmail({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <FieldText
      id={id}
      label="Email"
      icon={Mail}
      type="email"
      placeholder="you@example.com"
      value={value}
      onChange={onChange}
    />
  );
}

function FieldPassword({
  id,
  value,
  onChange,
  show,
  onToggleShow,
  helper,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  helper?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-foreground/80">
        Password
      </Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          placeholder="Enter any password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 pl-10 pr-11 bg-card/60"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 rounded-md",
            "flex items-center justify-center text-muted-foreground",
            "hover:text-foreground hover:bg-accent transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          )}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helper && <p className="text-[11px] text-muted-foreground pl-1">{helper}</p>}
    </div>
  );
}

/* ---------- Google brand icon (multi-color, inline SVG) ---------- */
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.9 3.36 14.7 2.4 12 2.4 6.8 2.4 2.6 6.6 2.6 11.8s4.2 9.4 9.4 9.4c5.42 0 9-3.8 9-9.16 0-.62-.07-1.1-.16-1.84H12z"
      />
      <path
        fill="#34A853"
        d="M3.88 7.55l3.2 2.35C7.95 8 9.83 6.7 12 6.7c1.88 0 3.14.8 3.86 1.49l2.63-2.53C16.9 3.36 14.7 2.4 12 2.4 8.24 2.4 5 4.53 3.88 7.55z"
        opacity="0"
      />
      <path
        fill="#FBBC05"
        d="M12 21.2c2.66 0 4.9-.88 6.53-2.4l-3.1-2.55c-.86.6-2 .98-3.43.98-2.64 0-4.88-1.78-5.68-4.18l-3.2 2.47C4.74 18.7 8.06 21.2 12 21.2z"
      />
      <path
        fill="#4285F4"
        d="M21 11.8c0-.62-.07-1.1-.16-1.84H12v3.9h5.5c-.27 1.6-1.94 3.1-5.5 3.1v.06z"
      />
    </svg>
  );
}
