import { Eye, EyeOff, Lock, Mail, Loader2, Wallet } from "lucide-react";

import { Input } from "@/components/ui/input";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BrandPanel } from "@/components/auth/BrandPanel";

export function IconInput({
  icon: Icon,
  className,
  ...props
}: React.ComponentProps<typeof Input> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input className={cn("h-11 pl-10", className)} {...props} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function EmailField({ control, name, disabled }: { control: any; name: any; disabled: boolean }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs font-semibold text-foreground/80">Email</FormLabel>
          <FormControl>
            <IconInput
              icon={Mail}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              disabled={disabled}
              {...field}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function PasswordField({
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
                autoComplete={name === "password" ? "current-password" : "new-password"}
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

export function SubmitButton({ busy, idle, busyLabel }: { busy: boolean; idle: string; busyLabel: string }) {
  return (
    <Button type="submit" className="h-11 w-full gap-2" disabled={busy}>
      {busy && <Loader2 className="h-4 w-4 animate-spin" />}
      {busy ? busyLabel : idle}
    </Button>
  );
}

export function CheckingSession() {
  return (
    <div className="flex items-center justify-center py-10 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="ml-2 text-sm">Checking your session...</span>
    </div>
  );
}

/** Shared two-column shell (brand panel + card) every auth page renders into. */
export function AuthPageShell({
  eyebrow,
  title,
  sub,
  children,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <BrandPanel />

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
                <p className="eyebrow">{eyebrow}</p>
                <h2 className="mt-2 font-display text-3xl font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{sub}</p>
              </div>

              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
