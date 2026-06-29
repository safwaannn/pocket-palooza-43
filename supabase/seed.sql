-- =============================================================
-- Pocket Palooza — Demo Seed
-- Creates one demo user and populates all tables with 3 months
-- of realistic INR data so every page has something to show.
--
-- Run via:  supabase db reset   (local)
--       or: paste into the Supabase SQL Editor (hosted)
-- =============================================================

-- ── 1. Demo user ─────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'safwangharemt@gmail.com') THEN
    INSERT INTO auth.users (
      id, aud, role, email,
      encrypted_password,
      email_confirmed_at, confirmation_sent_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token,
      is_sso_user, is_super_admin
    ) VALUES (
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      'authenticated', 'authenticated',
      'safwangharemt@gmail.com',
      crypt('sg80808080', gen_salt('bf')),
      now(), now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Safwan Ghare"}',
      now(), now(),
      '', '',
      false, false
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, provider,
      identity_data, last_sign_in_at, created_at, updated_at
    ) VALUES (
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
      'safwangharemt@gmail.com', 'email',
      '{"sub":"a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14","email":"safwangharemt@gmail.com"}',
      now(), now(), now()
    );
  END IF;
END $$;

-- Profile (trigger does this on real signup; seed must do it manually)
INSERT INTO public.profiles (id, name)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Safwan Ghare')
ON CONFLICT (id) DO NOTHING;

-- ── 2. Resolve category IDs into a temp table ─────────────────
-- Categories were inserted without explicit IDs so we look them up by name.
CREATE TEMP TABLE _cats AS
  SELECT id, name, type FROM public.categories WHERE user_id IS NULL;

-- ── 3. Transactions — April, May, June 2026 ──────────────────
-- Using a CTE so we can reference category names cleanly.
WITH c AS (SELECT id, name FROM _cats)
INSERT INTO public.transactions (user_id, category_id, amount, type, note, date)
SELECT
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  c.id,
  t.amount,
  t.type::public.transaction_type,
  t.note,
  t.date::date
FROM (VALUES
  -- ── April 2026 ──
  ('Salary',        85000,  'income',  'April salary',              '2026-04-01'),
  ('Freelance',     18000,  'income',  'Website project',           '2026-04-08'),
  ('Rent',          15000,  'expense', 'April rent',                '2026-04-02'),
  ('Food',           3200,  'expense', 'Groceries',                 '2026-04-05'),
  ('Food',           1800,  'expense', 'Restaurants',               '2026-04-12'),
  ('Travel',         4500,  'expense', 'Weekend trip to Lonavala',  '2026-04-14'),
  ('Bills',          2100,  'expense', 'Electricity + internet',    '2026-04-07'),
  ('Entertainment',  1500,  'expense', 'OTT subscriptions',         '2026-04-10'),
  ('Shopping',       5200,  'expense', 'Clothes',                   '2026-04-18'),
  ('Health',         1200,  'expense', 'Pharmacy',                  '2026-04-20'),
  ('Food',           2400,  'expense', 'Weekly groceries',          '2026-04-22'),
  ('Entertainment',   800,  'expense', 'Movie tickets',             '2026-04-26'),
  ('Travel',         1200,  'expense', 'Cab fares',                 '2026-04-28'),

  -- ── May 2026 ──
  ('Salary',        85000,  'income',  'May salary',                '2026-05-01'),
  ('Freelance',     12000,  'income',  'Logo design project',       '2026-05-15'),
  ('Other Income',   5000,  'income',  'Sold old laptop',           '2026-05-20'),
  ('Rent',          15000,  'expense', 'May rent',                  '2026-05-02'),
  ('Food',           3500,  'expense', 'Groceries',                 '2026-05-04'),
  ('Bills',          1900,  'expense', 'Electricity',               '2026-05-06'),
  ('Health',         3200,  'expense', 'Dentist appointment',       '2026-05-09'),
  ('Food',           2100,  'expense', 'Restaurants',               '2026-05-13'),
  ('Travel',         6800,  'expense', 'Flight — Mumbai to Delhi',  '2026-05-16'),
  ('Shopping',       3800,  'expense', 'Electronics accessories',   '2026-05-19'),
  ('Entertainment',  2400,  'expense', 'Concert tickets',           '2026-05-22'),
  ('Food',           1900,  'expense', 'Weekly groceries',          '2026-05-25'),
  ('Shopping',       1400,  'expense', 'Books',                     '2026-05-27'),
  ('Travel',          900,  'expense', 'Cab fares',                 '2026-05-29'),

  -- ── June 2026 ──
  ('Salary',        85000,  'income',  'June salary',               '2026-06-01'),
  ('Freelance',     22000,  'income',  'React dashboard project',   '2026-06-10'),
  ('Rent',          15000,  'expense', 'June rent',                 '2026-06-02'),
  ('Bills',          2300,  'expense', 'Electricity + internet',    '2026-06-05'),
  ('Food',           4100,  'expense', 'Groceries',                 '2026-06-06'),
  ('Travel',         3200,  'expense', 'Train — Mumbai to Pune',    '2026-06-08'),
  ('Health',         1500,  'expense', 'Gym membership',            '2026-06-10'),
  ('Food',           2600,  'expense', 'Restaurants',               '2026-06-14'),
  ('Shopping',       7200,  'expense', 'Shoes + accessories',       '2026-06-17'),
  ('Entertainment',  3100,  'expense', 'IPL match tickets',         '2026-06-20'),
  ('Food',           2100,  'expense', 'Weekly groceries',          '2026-06-23'),
  ('Travel',         1800,  'expense', 'Cab fares',                 '2026-06-25'),
  ('Other Expense',  2500,  'expense', 'Miscellaneous',             '2026-06-28')
) AS t(cat_name, amount, type, note, date)
JOIN c ON c.name = t.cat_name
ON CONFLICT DO NOTHING;

-- ── 4. Budgets — June 2026 ────────────────────────────────────
WITH c AS (SELECT id, name FROM _cats)
INSERT INTO public.budgets (user_id, category_id, month_year, limit_amount)
SELECT
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  c.id,
  '2026-06',
  b.limit_amount
FROM (VALUES
  ('Food',          10000),
  ('Rent',          15000),
  ('Travel',         5000),
  ('Shopping',       6000),
  ('Bills',          3000),
  ('Entertainment',  4000),
  ('Health',         2000)
) AS b(cat_name, limit_amount)
JOIN c ON c.name = b.cat_name
ON CONFLICT (user_id, category_id, month_year) DO NOTHING;

-- ── 5. Budgets — May 2026 ─────────────────────────────────────
WITH c AS (SELECT id, name FROM _cats)
INSERT INTO public.budgets (user_id, category_id, month_year, limit_amount)
SELECT
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  c.id,
  '2026-05',
  b.limit_amount
FROM (VALUES
  ('Food',          10000),
  ('Rent',          15000),
  ('Travel',         5000),
  ('Shopping',       4000),
  ('Bills',          3000),
  ('Entertainment',  2000),
  ('Health',         2000)
) AS b(cat_name, limit_amount)
JOIN c ON c.name = b.cat_name
ON CONFLICT (user_id, category_id, month_year) DO NOTHING;

-- ── 6. Budget alerts — June 2026 ─────────────────────────────
-- Travel (₹5k spent of ₹5k limit → 100% alert)
-- Shopping (₹7.2k spent of ₹6k limit → 100% alert + acknowledged 80%)
-- Entertainment (₹3.1k spent of ₹4k limit → 80% alert)
WITH c AS (SELECT id, name FROM _cats)
INSERT INTO public.budget_alerts (user_id, category_id, month_year, threshold, acknowledged)
SELECT
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  c.id,
  '2026-06',
  a.threshold,
  a.acknowledged
FROM (VALUES
  ('Travel',         80, true),
  ('Travel',        100, false),
  ('Shopping',       80, true),
  ('Shopping',      100, false),
  ('Entertainment',  80, false)
) AS a(cat_name, threshold, acknowledged)
JOIN c ON c.name = a.cat_name
ON CONFLICT (user_id, category_id, month_year, threshold) DO NOTHING;

-- ── 7. Budget alerts — May 2026 ──────────────────────────────
WITH c AS (SELECT id, name FROM _cats)
INSERT INTO public.budget_alerts (user_id, category_id, month_year, threshold, acknowledged)
SELECT
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14',
  c.id,
  '2026-05',
  a.threshold,
  a.acknowledged
FROM (VALUES
  ('Travel',        80, true),
  ('Travel',       100, true),
  ('Health',        80, true)
) AS a(cat_name, threshold, acknowledged)
JOIN c ON c.name = a.cat_name
ON CONFLICT (user_id, category_id, month_year, threshold) DO NOTHING;

DROP TABLE IF EXISTS _cats;
