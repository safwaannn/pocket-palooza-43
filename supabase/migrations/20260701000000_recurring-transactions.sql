-- Recurring transactions: templates that materialize into `transactions` on their next_run date.
--
-- Frequencies: daily, weekly, monthly, yearly. `interval_count` lets you say "every 2 weeks".
-- `next_run` is the date the next instance is due. `end_date` optionally caps the schedule.
-- `active` lets a user pause a schedule without deleting it.

CREATE TABLE IF NOT EXISTS public.recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  type public.transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily','weekly','monthly','yearly')),
  interval_count SMALLINT NOT NULL DEFAULT 1 CHECK (interval_count >= 1 AND interval_count <= 365),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_run DATE NOT NULL,
  end_date DATE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_run DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recurring_txn_user_next_idx
  ON public.recurring_transactions (user_id, next_run);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_transactions TO authenticated;
GRANT ALL ON public.recurring_transactions TO service_role;

ALTER TABLE public.recurring_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Own recurring txns all"
  ON public.recurring_transactions FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
