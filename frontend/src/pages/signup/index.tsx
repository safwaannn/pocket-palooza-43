import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { User } from "lucide-react";

import {
  AuthPageShell,
  CheckingSession,
  EmailField,
  IconInput,
  PasswordField,
  SubmitButton,
} from "@/components/auth/AuthFormFields";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { authErrorMessage, signupSchema, safeNext, type SignupValues } from "@/lib/auth";
import { useAuth } from "@/lib/auth-context";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function SignUpPage() {
  useDocumentTitle("Create your account - Paisa");
  const [searchParams] = useSearchParams();
  const redirectTarget = safeNext(searchParams.get("next"));
  const navigate = useNavigate();
  const { user, loading, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate(redirectTarget, { replace: true });
    }
  }, [loading, user, redirectTarget, navigate]);

  const checkingSession = loading || !!user;

  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", passwordConfirm: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: SignupValues) => {
    try {
      await signUp(values);
      toast.success("Account created. You're in!");
      navigate(redirectTarget, { replace: true });
    } catch (err) {
      toast.error(authErrorMessage(err, "Sign up failed"));
    }
  };

  const busy = form.formState.isSubmitting;

  return (
    <AuthPageShell
      eyebrow="New account"
      title="Create your account"
      sub="Start tracking your finances in under a minute."
    >
      {checkingSession ? (
        <CheckingSession />
      ) : (
        <>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold text-foreground/80">Name</FormLabel>
                    <FormControl>
                      <IconInput icon={User} placeholder="Jane Doe" disabled={busy} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <EmailField control={form.control} name="email" disabled={busy} />
              <PasswordField
                control={form.control}
                name="password"
                label="Password"
                disabled={busy}
                show={showPassword}
                onToggleShow={() => setShowPassword((s) => !s)}
                helper="Use at least 8 characters."
              />
              <PasswordField
                control={form.control}
                name="passwordConfirm"
                label="Confirm password"
                disabled={busy}
                show={showPassword}
                onToggleShow={() => setShowPassword((s) => !s)}
              />

              <SubmitButton busy={busy} idle="Create account" busyLabel="Creating..." />
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
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
