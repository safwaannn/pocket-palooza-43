# Personal Finance Tracker — Build Plan

A full-stack personal finance app with auth, transactions, categories, budgets, alerts, and charts. Backend uses Lovable Cloud (Supabase under the hood) instead of a separate Node/Express + MySQL stack — same relational model, less setup, all-in-one.

## Scope (v1)
- Email/password auth (single user role; admin layer deferred)
- Transactions CRUD with filters and search
- Default + custom categories
- Monthly per-category budgets with 80% / 100% banner alerts
- Dashboard, Reports (pie + line/bar), full transaction list
- Currency: ₹ (INR)

## Pages
1. `/auth` — login / signup
2. `/` — Dashboard (totals, budget bars, recent txns, quick add) [protected]
3. `/transactions` — list + filters + add/edit/delete [protected]
4. `/categories` — manage custom categories [protected]
5. `/budgets` — set monthly limits per category [protected]
6. `/reports` — pie + line charts with date range [protected]

## Database (Lovable Cloud / Postgres)
- `profiles` (id → auth.users, name, created_at)
- `categories` (id, user_id nullable for defaults, name, type: income|expense)
- `transactions` (id, user_id, category_id, amount, type, note, date, created_at)
- `budgets` (id, user_id, category_id, month_year `YYYY-MM`, limit_amount; unique on user+category+month)
- RLS: every table scoped to `auth.uid()`; defaults categories readable by all authenticated users
- Trigger: auto-create profile on signup
- Seed: default categories (Food, Rent, Travel, Shopping, Bills, Salary, Other)
- Explicit GRANTs for `authenticated` + `service_role`

## Budget Logic
For each (category, current month): `SUM(transactions.amount WHERE type='expense' AND date in month) / budgets.limit_amount`. Show progress bars; banner when ≥80% (warning) or ≥100% (danger).

## Tech
- TanStack Start + React 19 + Tailwind v4 (project default)
- Recharts for charts
- shadcn/ui components (Card, Dialog, Form, Progress, Tabs, Select, DatePicker)
- React Hook Form + Zod for validation
- TanStack Query for data fetching
- Supabase JS client (browser) for all CRUD — RLS enforces ownership

## Design
Clean, modern fintech feel — soft neutral background, single accent (deep emerald green for "money / positive"), red reserved for expenses/over-budget. Rounded cards, generous spacing, clear hierarchy. Mobile-friendly.

## Build Order
1. Enable Lovable Cloud
2. Schema migration (tables + RLS + GRANTs + trigger + default categories seed)
3. Design system tokens in `styles.css`
4. Auth route + protected layout (`_authenticated`)
5. Categories CRUD
6. Transactions CRUD + filters
7. Budgets CRUD + spent-vs-limit calculation hook
8. Dashboard
9. Reports (Recharts)
10. Polish + alert banners

## Out of Scope (v1)
Admin role, email alerts, multi-currency, recurring transactions, CSV import/export. Easy to add later.
