import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="relative flex flex-col items-center justify-center text-center py-20 px-6 rounded-3xl border border-dashed border-primary/20 bg-gradient-to-br from-accent/30 via-card to-card overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-40 [background:radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_60%)]" />
      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center mb-5 shadow-glow">
        <Icon className="h-8 w-8 text-primary-foreground" />
      </div>
      <h3 className="font-display text-xl font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
