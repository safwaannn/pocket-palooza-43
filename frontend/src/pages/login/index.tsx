import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  AuthPageShell,
  CheckingSession,
  EmailField,
  PasswordField,
  SubmitButton,
} from "@/components/auth/AuthFormFields";
import { Form } from "@/components/ui/form";
import { authErrorMessage, loginSchema, safeNext, type LoginValues } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function LoginPage() {
  useDocumentTitle("Sign in - Paisa");
  const [searchParams] = useSearchParams();
  const redirectTarget = safeNext(searchParams.get("next"));
  const navigate = useNavigate();
  const { user, loading, signIn } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // If a session already exists (resolved by AuthProvider), skip this page.
  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [loading, user, redirectTarget, navigate]);

  const checkingSession = loading || !!user;

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: LoginValues) => {
    try {
      await signIn(values);
      toast.success("Welcome back!");
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      toast.error(authErrorMessage(err, "Sign in failed"));
    }
  };

  const busy = form.formState.isSubmitting;

  return (
    <AuthPageShell
      eyebrow="Welcome back"
      title="Sign in to Paisa"
      sub="Continue to your dashboard and latest finance view."
    >
      {checkingSession ? (
        <CheckingSession />
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <EmailField control={form.control} name="email" disabled={busy} />
              <PasswordField
                control={form.control}
                name="password"
                label="Password"
                disabled={busy}
                show={showPassword}
                onToggleShow={() => setShowPassword((s) => !s)}
              />

              <div className="-mt-1 flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>

              <SubmitButton busy={busy} idle="Sign in" busyLabel="Signing in..." />
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/signup" className="font-medium text-primary hover:underline">
              Sign up
            </Link>
          </p>

          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            By continuing you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-2 hover:text-primary">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="underline underline-offset-2 hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
        </>
      )}
    </AuthPageShell>
  );
}
