CREATE TABLE public.budget_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  threshold SMALLINT NOT NULL CHECK (threshold IN (80, 100)),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  emailed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, category_id, month_year, threshold)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.budget_alerts TO authenticated;
GRANT ALL ON public.budget_alerts TO service_role;

ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own alerts all"
  ON public.budget_alerts FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX budget_alerts_user_month_idx ON public.budget_alerts (user_id, month_year DESC);