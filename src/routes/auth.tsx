import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ComponentType, type FormEvent } from "react";
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
    meta: [{ title: "Sign in - Paisa" }],
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

  const handleSignIn = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
    navigate({ to: "/dashboard", replace: true });
  };

  const handleSignUp = async (event: FormEvent) => {
    event.preventDefault();
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <aside className="hidden border-r border-primary/20 bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent text-foreground">
              <Wallet className="h-6 w-6" />
            </div>
            <span className="font-display text-2xl font-semibold">Paisa</span>
          </div>

          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase text-accent">Quiet Wealth</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-tight text-primary-foreground xl:text-6xl">
              Your money, reviewed with calm precision.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-primary-foreground/78">
              Track every transaction, review budgets, and keep your monthly cashflow in clear view.
            </p>

            <div className="mt-10 grid grid-cols-3 border-y border-primary-foreground/16">
              {[
                { label: "Income", value: "85k" },
                { label: "Budgeted", value: "12" },
                { label: "Alerts", value: "3" },
              ].map((metric, index) => (
                <div
                  key={metric.label}
                  className={`py-5 ${index > 0 ? "border-l border-primary-foreground/16 pl-5" : ""}`}
                >
                  <p className="finance-figure text-4xl font-semibold text-accent">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase text-primary-foreground/62">
                    {metric.label}
                  </p>
                </div>
              ))}
            </div>

            <ul className="mt-8 space-y-3">
              {[
                { icon: Sparkles, text: "AI-assisted budgeting and insights" },
                { icon: ShieldCheck, text: "Account-scoped finance data" },
                { icon: Wallet, text: "Income, expenses, and savings in one place" },
              ].map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-sm text-primary-foreground/84"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-card/10 text-accent ring-1 ring-primary-foreground/14">
                    <Icon className="h-4 w-4" />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-primary-foreground/58">
            &copy; {new Date().getFullYear()} Paisa. Built for quiet money habits.
          </p>
        </aside>

        <main className="flex items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md">
            <div className="mb-8 flex flex-col items-center lg:hidden">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground ring-1 ring-accent/35">
                <Wallet className="h-7 w-7" />
              </div>
              <h1 className="font-display text-3xl font-semibold">Paisa</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your money, in clear view.</p>
            </div>

            <div className="rounded-lg border border-border bg-card p-7 shadow-elegant sm:p-8">
              <div className="mb-6">
                <p className="eyebrow">{tab === "signin" ? "Welcome back" : "New account"}</p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  {tab === "signin" ? "Sign in to Paisa" : "Create your account"}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {tab === "signin"
                    ? "Continue to your dashboard and latest finance view."
                    : "Start tracking your finances in under a minute."}
                </p>
              </div>

              <Tabs value={tab} onValueChange={(value) => setTab(value as "signin" | "signup")}>
                <TabsList className="mb-6 grid w-full grid-cols-2">
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
                      onToggleShow={() => setShowPassword((state) => !state)}
                    />

                    <div className="-mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                      >
                        Forgot password?
                      </button>
                    </div>

                    <Button type="submit" className="h-11 w-full" disabled={loading}>
                      {loading ? "Signing in..." : "Sign in"}
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
                      onToggleShow={() => setShowPassword((state) => !state)}
                      helper="Any password works - easy, normal, or hard."
                    />

                    <Button type="submit" className="h-11 w-full" disabled={loading}>
                      {loading ? "Creating..." : "Create account"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold uppercase text-muted-foreground">or</span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button
                variant="outline"
                className="h-11 w-full gap-2"
                onClick={handleGoogle}
                type="button"
              >
                <GoogleIcon className="h-4 w-4" />
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
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
  icon: ComponentType<{ className?: string }>;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">
        {label}
      </Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={type}
          required={required}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 pl-10"
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
  onChange: (value: string) => void;
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
  onChange: (value: string) => void;
  show: boolean;
  onToggleShow: () => void;
  helper?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-semibold text-foreground/80">
        Password
      </Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          required
          placeholder="Enter any password"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 pl-10 pr-11"
        />
        <button
          type="button"
          onClick={onToggleShow}
          aria-label={show ? "Hide password" : "Show password"}
          aria-pressed={show}
          className={cn(
            "absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md",
            "text-muted-foreground transition-colors hover:bg-accent/20 hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
          )}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {helper && <p className="pl-1 text-[11px] text-muted-foreground">{helper}</p>}
    </div>
  );
}

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
