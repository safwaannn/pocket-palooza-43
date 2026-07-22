-- Expand the existing role model from admin/user into a small RBAC ladder.
-- `user` remains the default signup role for backward compatibility.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'viewer';

CREATE OR REPLACE FUNCTION public.has_any_role(_user_id UUID, _roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role::TEXT = ANY(_roles)
  );
$$;

REVOKE EXECUTE ON FUNCTION public.has_any_role(UUID, TEXT[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_any_role(UUID, TEXT[]) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.can_read_own_finance(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin','manager','user','viewer']);
$$;

CREATE OR REPLACE FUNCTION public.can_write_own_finance(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_any_role(_user_id, ARRAY['admin','manager','user']);
$$;

REVOKE EXECUTE ON FUNCTION public.can_read_own_finance(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_write_own_finance(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_read_own_finance(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_write_own_finance(UUID) TO authenticated, service_role;

DROP POLICY IF EXISTS "Own transactions all" ON public.transactions;
CREATE POLICY "Read own transactions by role"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.can_read_own_finance(auth.uid()));
CREATE POLICY "Insert own transactions by role"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Update own transactions by role"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Delete own transactions by role"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));

DROP POLICY IF EXISTS "Own budgets all" ON public.budgets;
CREATE POLICY "Read own budgets by role"
  ON public.budgets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.can_read_own_finance(auth.uid()));
CREATE POLICY "Insert own budgets by role"
  ON public.budgets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Update own budgets by role"
  ON public.budgets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Delete own budgets by role"
  ON public.budgets FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));

DROP POLICY IF EXISTS "Insert own categories" ON public.categories;
DROP POLICY IF EXISTS "Update own categories" ON public.categories;
DROP POLICY IF EXISTS "Delete own categories" ON public.categories;
CREATE POLICY "Insert own categories by role"
  ON public.categories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Update own categories by role"
  ON public.categories FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Delete own categories by role"
  ON public.categories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));

DROP POLICY IF EXISTS "Own alerts all" ON public.budget_alerts;
CREATE POLICY "Read own alerts by role"
  ON public.budget_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.can_read_own_finance(auth.uid()));
CREATE POLICY "Insert own alerts by role"
  ON public.budget_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Update own alerts by role"
  ON public.budget_alerts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Delete own alerts by role"
  ON public.budget_alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));

DROP POLICY IF EXISTS "Own recurring txns all" ON public.recurring_transactions;
CREATE POLICY "Read own recurring txns by role"
  ON public.recurring_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id AND public.can_read_own_finance(auth.uid()));
CREATE POLICY "Insert own recurring txns by role"
  ON public.recurring_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Update own recurring txns by role"
  ON public.recurring_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
CREATE POLICY "Delete own recurring txns by role"
  ON public.recurring_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND public.can_write_own_finance(auth.uid()));
