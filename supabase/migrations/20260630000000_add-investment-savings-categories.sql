-- Add Investment and Savings as global income categories
INSERT INTO public.categories (user_id, name, type) VALUES
  (NULL, 'Investment Returns', 'income'),
  (NULL, 'Savings Withdrawal',  'income')
ON CONFLICT DO NOTHING;
