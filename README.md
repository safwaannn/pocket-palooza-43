# 💸 Paisa — Personal Finance Tracker

> **Your money, in clear view.**
> A clean, modern, full-stack personal finance app to track income & expenses, set budgets, get smart alerts, and visualize where every rupee goes.

[![Built with TanStack Start](https://img.shields.io/badge/TanStack-Start-FF4154?logo=react)](https://tanstack.com/start)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?logo=supabase)](https://supabase.com)

---

## ✨ Features

- 🔐 **Email / Password + Google OAuth** sign-in (with show / hide password toggle)
- 💰 **Transactions** — add, edit, delete income & expenses with categories, notes, and dates
- 📥 **CSV import / export** — bulk-import transactions from any spreadsheet, download all your data
- 🔁 **Recurring transactions** — schedule daily / weekly / monthly / yearly auto-posts (rent, salary, subscriptions)
- 💱 **Multi-currency** — switch between INR, USD, EUR, GBP, JPY, AUD, CAD, SGD, AED (per-user setting)
- 🏷️ **Categories** — default global ones (Food, Rent, Salary, …) plus your own custom ones
- 🎯 **Monthly Budgets** — set per-category limits and watch progress bars fill
- 🚨 **Smart Alerts** — automatic notifications at **80%** and **100%** of each budget
- 📬 **Email delivery** — budget alerts optionally emailed via a Resend-backed server endpoint
- 🛡️ **Admin panel** — dedicated `user_roles` table with `has_role()` guard; admins can view every user's totals and grant/revoke roles
- 📊 **Reports** — pie & bar charts powered by Recharts to reveal spending patterns
- 🎯 **Goals** — savings goals tracking
- 💡 **Insights** — AI-style summary cards on your spending behaviour
- 🔔 **Notifications center**
- ⚙️ **Settings** — profile, currency, sign-out
- 🛡️ **Row-Level Security** — every row is scoped to `auth.uid()` so your data stays yours
- 📱 **Fully responsive** with a polished glass / emerald design system

---

## 🧰 Tech Stack

| Layer | Tech |
|---|---|
| **Framework** | [TanStack Start](https://tanstack.com/start) (file-based routing + SSR) |
| **UI library** | [React 19](https://react.dev) |
| **Language** | [TypeScript 5.8](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com) + custom OKLCH theme tokens |
| **Components** | [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives) |
| **Icons** | [lucide-react](https://lucide.dev) |
| **Backend / DB** | [Supabase](https://supabase.com) (Postgres + Auth + RLS) via Lovable Cloud |
| **Data fetching** | [TanStack Query](https://tanstack.com/query) |
| **Forms** | [react-hook-form](https://react-hook-form.com) + [Zod](https://zod.dev) |
| **Charts** | [Recharts](https://recharts.org) |
| **Toasts** | [Sonner](https://sonner.emilkowal.ski/) |
| **Build / Dev** | [Vite 8](https://vitejs.dev) + [Nitro](https://nitro.unjs.io/) (server) |
| **Package mgr** | [Bun](https://bun.sh) (npm also works) |
| **Lint / Format** | ESLint 9 + Prettier 3 |

---

## 📂 Project Structure

```
pocket-palooza-43/
├── src/
│   ├── routes/                        # File-based router (TanStack Router)
│   │   ├── __root.tsx                 # Root layout, QueryClientProvider, Toaster
│   │   ├── index.tsx                  # Marketing landing page
│   │   ├── auth.tsx                   # Sign-in / Sign-up (redesigned, glass UI)
│   │   ├── about.tsx
│   │   ├── help.tsx
│   │   ├── privacy.tsx
│   │   ├── terms.tsx
│   │   └── _authenticated/            # Auth-gated routes (uses AppShell)
│   │       ├── route.tsx              # Auth guard layout
│   │       ├── dashboard.tsx          # Totals, budgets, recent txns
│   │       ├── transactions.tsx       # Full transaction list + filters
│   │       ├── categories.tsx         # Manage custom categories
│   │       ├── budgets.tsx            # Monthly per-category limits
│   │       ├── alerts.tsx             # 80% / 100% budget alerts
│   │       ├── reports.tsx            # Charts (pie / bar)
│   │       ├── insights.tsx
│   │       ├── goals.tsx
│   │       ├── notifications.tsx
│   │       ├── settings.tsx
│   │       └── support.tsx
│   │
│   ├── components/
│   │   ├── AppShell.tsx               # Sidebar + topbar for protected pages
│   │   ├── BrandMark.tsx              # Logo
│   │   ├── EmptyState.tsx
│   │   ├── Footer.tsx
│   │   ├── PageHeader.tsx
│   │   ├── StatCard.tsx               # KPI tiles
│   │   ├── TransactionForm.tsx        # Add/edit transaction modal form
│   │   └── ui/                        # shadcn/ui primitives (button, card, …)
│   │
│   ├── lib/
│   │   ├── finance-queries.ts         # TanStack Query hooks (txns, budgets, …)
│   │   ├── budget-alerts.ts           # 80% / 100% alert generation
│   │   ├── format.ts                  # Currency, date, monthRange helpers
│   │   ├── csv-export.ts
│   │   ├── utils.ts                   # cn() class merger
│   │   ├── lovable.ts                 # Lovable Cloud auth helpers
│   │   ├── lovable-error-reporting.ts
│   │   ├── error-capture.ts
│   │   └── error-page.ts
│   │
│   ├── supabase/                      # Browser & server Supabase clients
│   │   ├── client.ts
│   │   ├── client.server.ts
│   │   ├── types.ts                   # Generated DB types
│   │   ├── auth-middleware.ts
│   │   └── auth-attacher.ts
│   │
│   ├── integrations/
│   │   ├── supabase/
│   │   └── lovable/
│   │
│   ├── hooks/
│   │   └── use-mobile.tsx
│   │
│   ├── styles.css                     # Tailwind v4 theme tokens (OKLCH)
│   ├── router.tsx                     # Router definition
│   ├── routeTree.gen.ts               # Auto-generated by TanStack Router
│   ├── start.ts                       # TanStack Start entry
│   └── server.ts                      # SSR server entry
│
├── supabase/
│   ├── migrations/                    # SQL migrations (run in order)
│   │   ├── 20260627200456_*.sql       # Initial schema + RLS + seed categories
│   │   ├── 20260627200536_*.sql
│   │   ├── 20260628201517_*.sql       # budget_alerts table
│   │   └── 20260630000000_*.sql       # Investment / Savings categories
│   ├── seed.sql
│   └── config.toml
│
├── .env.example                       # Required env vars (copy → .env)
├── components.json                    # shadcn/ui config
├── vite.config.ts                     # Vite + Lovable plugin
├── tsconfig.json
├── eslint.config.js
├── package.json
└── README.md
```

---

## 🗃️ Database Schema

All tables live in the `public` schema with **Row-Level Security** enabled.
Every policy ensures users can only read / write their own rows.

| Table | Purpose | Key Columns |
|---|---|---|
| `profiles` | One row per signed-up user (auto-created via trigger) | `id` → `auth.users(id)`, `name`, `currency` |
| `categories` | Income / expense categories. `user_id IS NULL` = global default | `id`, `user_id?`, `name`, `type` |
| `transactions` | Every income or expense entry | `id`, `user_id`, `category_id?`, `amount`, `type`, `note`, `date` |
| `recurring_transactions` | Templates that auto-post on `next_run` (daily / weekly / monthly / yearly) | `id`, `user_id`, `category_id?`, `type`, `amount`, `frequency`, `interval_count`, `start_date`, `next_run`, `end_date?`, `active`, `last_run?` |
| `budgets` | One per (user, category, month) — `month_year = 'YYYY-MM'` | `id`, `user_id`, `category_id`, `month_year`, `limit_amount` |
| `budget_alerts` | Triggered when a budget hits 80% or 100% | `id`, `user_id`, `category_id`, `month_year`, `threshold`, `acknowledged`, `emailed` |
| `user_roles` | Role assignments backing the admin panel | `id`, `user_id`, `role` (`'admin' \| 'user'`) |

**Enums**

- `transaction_type` — `'income' | 'expense'`
- `app_role` — `'admin' | 'user'`

**Auto-magic**

- Trigger `on_auth_user_created` runs `handle_new_user()` after every `auth.users` insert to seed a `profiles` row **and** grant the default `'user'` role.
- Default categories are seeded into `categories` with `user_id = NULL` so every authenticated user can read them.
- SECURITY-DEFINER function `has_role(uid, role)` powers admin RLS policies without opening a hole for self-promotion.

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js ≥ 20** (or **Bun ≥ 1.1** — recommended; project uses `bun.lock`)
- A **Supabase** project (free tier is enough). Grab the URL + anon key from
  *Project Settings → API*.

### 2. Clone & install

```bash
git clone <your-repo-url>
cd pocket-palooza-43

# Using bun (recommended)
bun install

# …or npm
npm install
```

### 3. Configure environment variables

Copy `.env.example` → `.env` and fill in your Supabase values:

```env
# Client (Vite build-time)
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# Server (SSR / serverFn)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# Server-only — NEVER expose to the client
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 4. Apply database migrations

Run the SQL files in `supabase/migrations/` in chronological order via the
Supabase SQL Editor, or with the Supabase CLI:

```bash
supabase db push
```

### 5. Start the dev server

```bash
bun run dev
# or
npm run dev
```

Open **http://localhost:5173** (or the port shown in the terminal).

---

## 📜 NPM Scripts

| Command | Purpose |
|---|---|
| `bun run dev` | Start Vite dev server with HMR |
| `bun run build` | Production build (Vite + Nitro) |
| `bun run build:dev` | Development-mode build |
| `bun run preview` | Preview the built site |
| `bun run lint` | Run ESLint over the whole project |
| `bun run format` | Format everything with Prettier |

---

## 🔐 Authentication

The `/auth` route is a single-page redesigned glass-card UI:

- **Split-screen layout** — branded panel on the left, form on the right (mobile collapses to a centered card).
- **Sign in** with email + password.
- **Sign up** with name + email + password — *any* password length is accepted on the client (Supabase server enforces its own minimum, default **6 chars**, configurable in *Supabase → Authentication → Policies*).
- **Show / hide password** toggle (Eye / EyeOff icons).
- **Forgot password?** sends a reset email via `supabase.auth.resetPasswordForEmail`.
- **Continue with Google** OAuth.
- Auto-redirects to `/dashboard` once a session exists.

Protected pages live under `src/routes/_authenticated/` and share the
`AppShell` (sidebar + topbar). The auth guard lives in
`_authenticated/route.tsx`.

---

## 🎨 Design System

Defined in **`src/styles.css`** using Tailwind v4 `@theme` tokens with **OKLCH**
colors:

- **Brand** — Emerald primary (`oklch(0.52 0.14 162)`) with a brighter "glow"
  companion for highlights.
- **Background** — Warm off-white with a subtle green tint; gradient hero
  applied to `<body>`.
- **Fonts** — `Sora` (display) + `Inter` (sans), loaded via Google Fonts in
  `__root.tsx`.
- **Utilities** — `bg-gradient-primary`, `bg-gradient-brand`, `bg-gradient-hero`,
  `bg-gradient-card`, `bg-gradient-sidebar`, `text-gradient-brand`,
  `shadow-soft`, `shadow-elegant`, `shadow-glow`, and `glass`
  (backdrop-blurred translucent cards).
- **Radius** — Soft `0.9rem` base.

---

## 🧪 Budget Alert Logic

For each `(category, current month)`:

```
spent_pct = SUM(transactions.amount WHERE type='expense' AND date IN month)
          / budgets.limit_amount
```

- ≥ **80%** → warning alert
- ≥ **100%** → danger alert

Alerts are persisted to `budget_alerts` so each threshold is only fired once
per `(user, category, month, threshold)` (enforced via a `UNIQUE` constraint).
The sidebar badge in `AppShell` shows the count of *unacknowledged* alerts.

---

## 🛣️ Roadmap

Already shipped ✅
- Auth (email + Google) with show/hide password
- Categories CRUD
- Transactions CRUD with filters and search
- Budgets with 80% / 100% alerts
- Dashboard, Reports, Insights, Goals, Notifications, Settings
- CSV import / export
- Recurring transactions (daily / weekly / monthly / yearly, with pause + end-date)
- Multi-currency (INR / USD / EUR / GBP / JPY / AUD / CAD / SGD / AED)
- Email delivery for budget alerts (Resend, via `/api/email-budget-alerts`)
- Admin / multi-user role layer (`user_roles` + `has_role()`)

Planned 🚧
- Mobile app (React Native via Expo)

---

## 🛡️ Security Notes

- **Never** commit `.env` — it is already in `.gitignore`.
- The **service-role key** must only be used on the server (SSR, edge fns).
  It bypasses RLS.
- All client data access goes through the anon key + RLS policies, so users
  can only ever see their own rows.

---

## 🤝 Contributing

1. Fork the repo & create a branch: `git checkout -b feat/your-feature`
2. Run `bun run lint && bun run format` before committing
3. Open a PR with a short description of what / why

---

## 📄 License

This project is part of the **30-days-30-projects** series. Use it freely for
learning, personal projects, or as a starting point. Commercial use is fine —
attribution is appreciated but not required.

---

## 🙏 Credits

- Built on top of [TanStack Start](https://tanstack.com/start) and
  [Supabase](https://supabase.com).
- UI components from [shadcn/ui](https://ui.shadcn.com) and
  [Radix UI](https://www.radix-ui.com).
- Icons by [Lucide](https://lucide.dev).
- Scaffolded with help from [Lovable](https://lovable.dev).

---

<p align="center">
  Made with 💚 for clearer money decisions.
</p>
