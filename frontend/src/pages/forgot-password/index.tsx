import { Link } from "react-router-dom";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ArrowLeft, MailCheck } from "lucide-react";

import { AuthPageShell, EmailField, SubmitButton } from "@/components/auth/AuthFormFields";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { authErrorMessage, forgotPassword, forgotSchema, type ForgotValues } from "@/lib/auth";
import { useDocumentTitle } from "@/hooks/use-document-title";

export function ForgotPasswordPage() {
  useDocumentTitle("Reset your password - Paisa");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: ForgotValues) => {
    try {
      await forgotPassword(values);
      setSentTo(values.email);
      toast.success("Password reset link sent. Check your inbox.");
    } catch (err) {
      toast.error(authErrorMessage(err, "Could not send reset email"));
    }
  };

  const busy = form.formState.isSubmitting;

  return (
    <AuthPageShell
      eyebrow="Account recovery"
      title="Reset your password"
      sub="We'll email you a secure link to set a new password."
    >
      {sentTo ? (
        <div className="space-y-6">
          <div className="flex flex-col items-center rounded-lg border border-border bg-secondary/40 px-6 py-8 text-center">
            <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/20 text-primary">
              <MailCheck className="h-6 w-6" />
            </span>
            <p className="font-display text-lg font-semibold">Check your inbox</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              If an account exists for <span className="font-medium text-foreground">{sentTo}</span>,
              a password reset link is on its way. The link is valid for 10 minutes.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => setSentTo(null)}
            >
              Use a different email
            </Button>
            <Button asChild type="button" variant="ghost" className="h-11 w-full gap-2">
              <Link to="/login">
                <ArrowLeft className="h-4 w-4" />
                Back to sign in
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <EmailField control={form.control} name="email" disabled={busy} />
            <SubmitButton busy={busy} idle="Send reset link" busyLabel="Sending link..." />
            <Link
              to="/login"
              className="mx-auto flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </form>
        </Form>
      )}
    </AuthPageShell>
  );
}
