-- Multi-currency: each profile picks its preferred ISO 4217 code (INR default).
-- The whole app formats money using this per-user setting.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR'
    CHECK (char_length(currency) = 3 AND currency = upper(currency));
