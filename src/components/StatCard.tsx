import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: "default" | "success" | "destructive" | "warning";
  hint?: string;
}) {
  const toneClass = {
    default: "bg-accent text-accent-foreground",
    success: "bg-[color:var(--success)]/15 text-[color:var(--success)]",
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-[color:var(--warning)]/20 text-[color:var(--warning-foreground)]",
  }[tone];

  return (
    <Card>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${toneClass}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-xl font-semibold truncate">{value}</p>
          {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
