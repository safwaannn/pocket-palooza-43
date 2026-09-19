# Paisa Backend — Node / Express / MongoDB API

A REST API for the Paisa personal-finance app, built in the **natours
architecture** (see `../rules/rules.md`). Express 5, Mongoose 9, JWT auth,
CommonJS.

---

## Architecture

```
backend/
├── server.js              Entry point: env, DB connect, listen, safety nets
├── app.js                 Express app: middleware stack + route mounting
├── config.env             Secrets (gitignored) — copy the template and fill in
│
├── controllers/
│   ├── errorController.js      The one global error handler
│   ├── factoryHandler.js       Generic CRUD (with per-user ownership scoping)
│   ├── authController.js       signup, login, logout, protect, restrictTo, reset
│   ├── userController.js       /me, updateMe, deleteMe
│   ├── categoryController.js   global + custom categories
│   ├── transactionController.js CRUD + spending/summary aggregations
│   ├── budgetController.js     CRUD (upsert) + 80/100% alert detection
│   ├── budgetAlertController.js list, unread count, acknowledge
│   ├── recurringController.js  CRUD + materializer (auto-post due schedules)
│   └── adminController.js      list users, set roles
│
├── models/
│   ├── userModel.js            identity, bcrypt password, roles, currency
│   ├── categoryModel.js        income/expense, global (user:null) or custom
│   ├── transactionModel.js     amount, type, category, date
│   ├── budgetModel.js          per (user, category, month) limit
│   ├── budgetAlertModel.js     80/100% threshold crossings
│   └── recurringModel.js       schedule templates
│
├── routes/                     one router per resource
└── utils/
    ├── appError.js             operational-error class
    ├── catchAsync.js           async wrapper → global error handler
    ├── apiFeatures.js          filter / sort / field-limit / paginate
    └── email.js                nodemailer wrapper
```

**Key design points**

- **Separation** — `app.js` handles requests, `server.js` runs the process.
- **One error path** — every error funnels through `errorController.js`.
- **Ownership scoping** — the factory's `{ userScoped: true }` folds
  `user: req.user.id` into every query, so a user can never read or write
  another user's rows (IDOR closed by construction). Identity always comes from
  the JWT, never the URL or body.
- **Secure by default** — routers apply `protect` with `router.use()` so a new
  route below the gate is protected automatically.
- **Versioned** — everything under `/api/v1/`.

---

## Setup

```bash
cd backend
npm install

# Configure secrets
#   edit config.env — set DATABASE, DATABASE_PASSWORD, JWT_SECRET, EMAIL_*, etc.
#   (config.env is gitignored; the committed copy is a template)

npm start           # nodemon, development
npm run start:prod  # NODE_ENV=production
```

Required env vars (server refuses to start if any are missing): `DATABASE`,
`DATABASE_PASSWORD`, `JWT_SECRET`, `JWT_EXPIREIN`, `JWT_COOKIE_EXPIREIN`.

On first successful DB connect the server seeds the **global default
categories** (idempotent).

---

## Authentication

JWT, sent both as an `httpOnly` cookie (browsers) and in the JSON body (API
clients via `Authorization: Bearer <token>`). The token holds only the user id;
the user is re-fetched on every request, so role changes and deletions take
effect immediately.

**Roles:** `viewer` (read-only) · `user` · `manager` · `admin`.

**Response shape (consistent everywhere):**

```jsonc
// success (single)   { "status": "success", "data": { ... } }
// success (list)     { "status": "success", "results": 12, "page": 1, "limit": 100, "data": [ ... ] }
// fail (4xx)         { "status": "fail",  "message": "..." }
// error (5xx)        { "status": "error", "message": "..." }
```

---

## Endpoints

All paths are prefixed with `/api/v1`. 🔒 = requires login.

### Users & Auth — `/users`
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/users/signup` | — | Create account (returns token) |
| POST | `/users/login` | — | Log in |
| GET | `/users/logout` | — | Clear the auth cookie |
| POST | `/users/forgotPassword` | — | Email a reset link |
| PATCH | `/users/resetPassword/:token` | — | Set a new password via link |
| PATCH | `/users/updatePassword` | 🔒 | Change password (needs current) |
| GET | `/users/me` | 🔒 | Current user profile |
| PATCH | `/users/updateMe` | 🔒 | Update name / email / currency |
| DELETE | `/users/deleteMe` | 🔒 | Soft-delete own account |

### Categories — `/categories`
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/categories` | 🔒 | Global defaults + your custom ones |
| POST | `/categories` | 🔒 user+ | Create a custom category |
| PATCH | `/categories/:id` | 🔒 user+ | Edit your own category |
| DELETE | `/categories/:id` | 🔒 user+ | Delete your own category |

### Transactions — `/transactions`
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/transactions` | 🔒 | List (filter/sort/paginate via query) |
| GET | `/transactions/spending?month_year=YYYY-MM` | 🔒 | Expense total per category |
| GET | `/transactions/summary?start&end` | 🔒 | `{ income, expense, balance }` |
| POST | `/transactions` | 🔒 user+ | Create |
| GET | `/transactions/:id` | 🔒 | Read one |
| PATCH | `/transactions/:id` | 🔒 user+ | Update |
| DELETE | `/transactions/:id` | 🔒 user+ | Delete |

### Budgets — `/budgets`
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/budgets?month_year=YYYY-MM` | 🔒 | List budgets |
| POST | `/budgets` | 🔒 user+ | Set a limit (upsert per category/month) |
| POST | `/budgets/detect-alerts?month_year=YYYY-MM` | 🔒 user+ | Fire any newly-crossed 80/100% alerts |
| GET | `/budgets/:id` | 🔒 | Read one |
| DELETE | `/budgets/:id` | 🔒 user+ | Remove a budget |

### Budget Alerts — `/budget-alerts`
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/budget-alerts` | 🔒 | List alerts |
| GET | `/budget-alerts/unread-count` | 🔒 | `{ count }` for the sidebar badge |
| POST | `/budget-alerts/acknowledge-all` | 🔒 user+ | Mark all read |
| PATCH | `/budget-alerts/:id/acknowledge` | 🔒 user+ | Mark one read |
| DELETE | `/budget-alerts/:id` | 🔒 user+ | Delete an alert |

### Recurring Transactions — `/recurring-transactions`
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/recurring-transactions` | 🔒 | List schedules |
| POST | `/recurring-transactions` | 🔒 user+ | Create a schedule |
| POST | `/recurring-transactions/materialize` | 🔒 user+ | Post all due transactions |
| GET | `/recurring-transactions/:id` | 🔒 | Read one |
| PATCH | `/recurring-transactions/:id` | 🔒 user+ | Update (e.g. pause) |
| DELETE | `/recurring-transactions/:id` | 🔒 user+ | Delete |

### Admin — `/admin`
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/admin/me/roles` | 🔒 | Current user's roles (RBAC hook) |
| GET | `/admin/users` | 🔒 admin | All users + lifetime totals |
| PATCH | `/admin/users/:id/role` | 🔒 admin | Promote / demote a user |

### Misc
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Health check |

---

## Query features (list endpoints)

```
?type=expense                filter by field
?amount[gte]=500             operators: gte gt lte lt in nin (allow-listed)
?sort=-date,amount           sort (leading - = descending)
?fields=amount,date          projection
?page=2&limit=20             pagination (limit capped at 100)
```

---

## Connecting the front-end

The front-end (`../src`) has `// TODO:` stubs where Supabase calls used to be.
Point them at this API's endpoints (send `credentials: 'include'` so the
`httpOnly` JWT cookie round-trips), and set `CLIENT_ORIGIN` in `config.env` to
the front-end's dev origin (`http://localhost:5173`) for CORS.
