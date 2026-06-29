import { Wallet } from "lucide-react";

export function BrandMark({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const dims = size === "sm" ? "h-7 w-7" : size === "lg" ? "h-12 w-12" : "h-9 w-9";
  const icon = size === "sm" ? "h-4 w-4" : size === "lg" ? "h-6 w-6" : "h-5 w-5";
  const text = size === "sm" ? "text-sm" : size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2">
      <div className={`${dims} rounded-xl bg-primary flex items-center justify-center`}>
        <Wallet className={`${icon} text-primary-foreground`} />
      </div>
      <span className={`${text} font-semibold tracking-tight`}>Paisa</span>
    </div>
  );
}
