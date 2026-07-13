-- Ensure the `emailed` flag exists on budget_alerts. This was added ad-hoc in an earlier types.ts
-- generation but never had a proper migration — add one here so fresh Supabase projects have it.

ALTER TABLE public.budget_alerts
  ADD COLUMN IF NOT EXISTS emailed BOOLEAN NOT NULL DEFAULT false;

-- Partial index makes the "which alerts still need emailing?" query O(k) rather than O(n).
CREATE INDEX IF NOT EXISTS budget_alerts_unemailed_idx
  ON public.budget_alerts (user_id, created_at)
  WHERE emailed = false;
