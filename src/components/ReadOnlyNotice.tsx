import { Lock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function ReadOnlyNotice({
  title = "Read-only access",
  description = "Your current role can view this page, but changes are disabled.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <Alert className="mb-6 border-border/70 bg-muted/40">
      <Lock className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
