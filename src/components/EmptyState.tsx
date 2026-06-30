import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * EmptyState component displays a placeholder when no data is available.
 * Shows an icon, title, optional description, and optional action button.
 * @param icon - Lucide icon component to display
 * @param title - Main heading text
 * @param description - Optional descriptive text
 * @param action - Optional action element (e.g., button)
 */
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
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl border border-dashed bg-card/40">
      <div className="h-14 w-14 rounded-full bg-accent flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-accent-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1 max-w-md">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
