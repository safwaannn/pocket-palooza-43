import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  ShieldAlert,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { authErrorMessage, resetPassword, resetSchema, type ResetValues } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function ResetPasswordPage() {
  useDocumentTitle("Reset password - Paisa");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? undefined;
  const [done, setDone] = useState(false);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-lg bg-primary text-primary-foreground ring-1 ring-accent/35">
            <Wallet className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-semibold">Paisa</h1>
        </div>

        <div className="rounded-lg border border-border bg-card p-7 shadow-elegant sm:p-8">
          {!token ? (
            <InvalidLink />
          ) : done ? (
            <SuccessState />
          ) : (
            <ResetForm token={token} onDone={() => setDone(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

function ResetForm({ token, onDone }: { token: string; onDone: () => void }) {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: "", passwordConfirm: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: ResetValues) => {
    try {
      // On success the backend issues a fresh session token (stored by apiRaw),
      // so the user is effectively logged in. Refresh the context so the guard
      // sees the user, then navigate via the router (no full-page reload).
      await resetPassword(token, values);
      await refresh();
      onDone();
      toast.success("Password updated. Redirecting to your dashboard...");
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);
    } catch (err) {
      toast.error(authErrorMessage(err, "Could not reset password. The link may have expired."));
    }
  };

  const busy = form.formState.isSubmitting;

  return (
    <>
      <div className="mb-6">
        <p className="eyebrow">Account recovery</p>
        <h2 className="mt-2 font-display text-3xl font-semibold">Set a new password</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose a strong password you haven't used before. This reset link expires 10 minutes after
          it was sent.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <PasswordField
            control={form.control}
            name="password"
            label="New password"
            disabled={busy}
            show={showPassword}
            onToggleShow={() => setShowPassword((s) => !s)}
            helper="Use at least 8 characters."
          />
          <PasswordField
            control={form.control}
            name="passwordConfirm"
            label="Confirm new password"
            disabled={busy}
            show={showPassword}
            onToggleShow={() => setShowPassword((s) => !s)}
          />

          <Button type="submit" className="h-11 w-full gap-2" disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {busy ? "Updating..." : "Reset password"}
          </Button>
        </form>
      </Form>

      <div className="mt-6 flex justify-center">
        <Link
          to="/login"
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </>
  );
}

function InvalidLink() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <ShieldAlert className="h-6 w-6" />
      </span>
      <h2 className="font-display text-2xl font-semibold">Invalid reset link</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        This password reset link is missing its token or has expired. Request a new one from the
        sign-in page.
      </p>
      <Button asChild className="mt-6 h-11 w-full">
        <Link to="/forgot-password">Request a new link</Link>
      </Button>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center py-4 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-primary">
        <CheckCircle2 className="h-6 w-6" />
      </span>
      <h2 className="font-display text-2xl font-semibold">Password updated</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        You're all set. Taking you to your dashboard...
      </p>
      <Button asChild variant="outline" className="mt-6 h-11 w-full">
        <Link to="/dashboard">Go to dashboard</Link>
      </Button>
    </div>
  );
}

function PasswordField({
  control,
  name,
  label,
  disabled,
  show,
  onToggleShow,
  helper,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  name: any;
  label: string;
  disabled: boolean;
  show: boolean;
  onToggleShow: () => void;
  helper?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold text-foreground/80">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={show ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                disabled={disabled}
                className="h-11 pl-10 pr-11"
                {...field}
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
          </FormControl>
          {helper && <FormDescription className="text-[11px]">{helper}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
