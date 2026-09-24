# A Field Project Report On

# PAISA
### (FinTrack — A Personal Finance Tracker)

**Submitted By**
Safwan Ghare
Arham Sarang

**Under the Guidance of**
Prof. Kamil Khan

This Field Project Report is submitted to the Department of Computer Application, in partial
fulfilment of the requirements for Semester V of the Bachelor of Computer Application programme,
academic year 2026-2027.

---

## Index

| Sr. No. | Topic |
|---|---|
| 1 | Introduction |
| 2 | Problem Definition |
| 3 | Existing System |
| 4 | Proposed System (Purpose, Scope & Objectives, Functional Requirements, Non-Functional Requirements) |
| 5 | Need of the Proposed System |
| 6 | Scope of the Proposed System |
| 7 | Fact Finding Techniques |
| 8 | Feasibility Study |
| 9 | Hardware and Software Requirements |
| 10 | ER Diagram |
| 11 | Data Dictionary |
| 12 | DFD / UML Diagrams |
| 13 | Input / Output Screens |
| 14 | Limitations |
| 15 | Conclusion |
| 16 | Bibliography |

---

## Acknowledgement

We would like to express our sincere gratitude to everyone who supported and guided us in
completing our Field Project titled **"PAISA — Personal Finance Tracker."**

First and foremost, we thank our Project Guide, **Prof. Kamil Khan**, for providing valuable
guidance, suggestions, and continuous support throughout the design and development of this
project.

We are grateful to the Head of the Department and our college for providing us with the
necessary facilities and encouragement to complete this project successfully, and to all the
faculty members of the Department of Computer Application for their support during the project.

Finally, we thank our parents, friends, and classmates for their encouragement throughout the
completion of this project.

**Project Team**
Safwan Ghare and Arham Sarang

---

## 1. Introduction

**PAISA** is a full-stack personal finance tracking web application designed to help an individual
user record income and expenses, organise them by category, plan monthly budgets, and stay on
top of spending through automatic alerts.

The system is built as a decoupled, two-tier architecture:

- A **React 19 + TypeScript** single-page front end (Vite, React Router 7, TanStack Query,
  Tailwind CSS v4, shadcn/ui on Radix primitives, Recharts for charts).
- A **Node.js / Express 5** REST API back end that persists data in **MongoDB** via **Mongoose 9**.

Key capabilities include:

- Secure authentication with JWT (delivered as an `httpOnly` cookie **and** in the JSON body for
  API clients).
- Role-based access control — `viewer`, `user`, `manager`, `admin`.
- Multi-currency support — INR, USD, EUR, GBP, JPY, AUD, CAD, SGD, AED (per-user setting).
- Global default categories plus user-owned custom categories.
- Full transaction CRUD with CSV import/export.
- Monthly, per-category budgets with automatic **80% / 100%** threshold alerting.
- Recurring transaction schedules (daily / weekly / monthly / yearly) that auto-post real
  transactions on their due date.
- **Paisa Assistant** — an AI chat feature (Google Gemini API) that answers natural-language
  questions grounded only in the logged-in user's own transactions, budgets, and categories.
- An admin panel for viewing all users' lifetime totals and managing roles.

This document covers the problem the project solves, the system design (ER model, data
dictionary, DFD/UML diagrams), the functional and non-functional requirements, and the screens
that make up the finished application.

---

## 2. Problem Definition

Most individuals track personal income and expenses using scattered, manual methods:

- A banking app's transaction history, which usually covers only one account and isn't
  categorised for budgeting.
- A manually maintained spreadsheet, which requires discipline to update and offers no automated
  alerting.
- No system at all — spending is simply remembered.

None of these give a single, categorised, real-time view of where money is going, and none of
them proactively warn the user **before** a spending limit is crossed. Overspending is usually
noticed only after the fact, and recurring obligations (rent, subscriptions, salary) are tracked
from memory rather than from a schedule.

---

## 3. Existing System

Before a system like PAISA, a typical user relies on:

1. The transaction history built into a banking app — not categorised for budgeting and doesn't
   merge cash spending or multiple accounts.
2. Manually maintained spreadsheets — require manual updates, manual charting, and offer no
   automated alerting.
3. Generic note-taking apps — no structure, no aggregation, no alerts at all.

None of these approaches provide per-category budget limits, automatic 80%/100% threshold
alerts, multi-currency support, recurring-transaction automation, or an assistant that can answer
a plain-English question about spending patterns.

---

## 4. Proposed System

The proposed PAISA platform provides a single, secure, multi-currency workspace where a user
records every income and expense, classifies it by category, sets a monthly limit per category,
and is automatically alerted as that limit is approached or crossed. Recurring income and expenses
are scheduled once and auto-posted going forward, and an AI assistant gives instant,
data-grounded answers about the user's own spending.

### Purpose

To centralise personal financial record-keeping and replace manual tracking with an automated,
categorised, and alert-driven system that gives the user a clear, current view of their income,
expenses, and budget health at all times.

### Scope & Objectives

The scope covers secure user registration and login, transaction CRUD with CSV import/export,
global and custom categories, monthly per-category budgets with automatic 80%/100% alert
detection, recurring transaction schedules with a materializer, multi-currency preferences, an
admin layer for role management, and an AI assistant scoped to the logged-in user's own data.
Real-time bank-account syncing, investment-portfolio tracking, and a native mobile app are out of
scope for the current version.

### Functional Requirements

- **FR-01:** The system shall allow a user to sign up and log in with an email and password,
  issuing a JWT held in an `httpOnly` cookie.
- **FR-02:** The system shall let a user create, view, edit, and delete income/expense
  transactions, each with an amount, type, category, date, and note.
- **FR-03:** The system shall let a user import transactions from a CSV file and export their
  transaction history to CSV.
- **FR-04:** The system shall provide a set of global default categories and allow the user to
  create, edit, and delete their own custom categories.
- **FR-05:** The system shall let a user set a monthly spending limit (budget) per expense
  category and automatically detect when spending reaches 80% or 100% of that limit.
- **FR-06:** The system shall notify the user of triggered budget alerts and let them acknowledge
  one alert or all alerts.
- **FR-07:** The system shall let a user define recurring transaction schedules
  (daily/weekly/monthly/yearly) that auto-post a real transaction on their due date.
- **FR-08:** The system shall let a user switch their preferred display currency among nine
  supported currencies.
- **FR-09:** The system shall provide an AI assistant endpoint that answers a user's
  natural-language question using only that user's own recent transactions, budgets, and
  categories as context.
- **FR-10:** The system shall let an administrator view all users and their lifetime totals, and
  promote or demote a user's role.

### Non-Functional Requirements

- **Performance:** List endpoints support filtering, sorting, field projection, and pagination
  (capped at 100 records per page) so responses stay fast as data grows.
- **Security:** Passwords are hashed with bcrypt and never returned by the API; every data route
  is scoped to the authenticated user's own records so one user can never read or modify
  another's data (no IDOR).
- **Usability:** The interface is built with shadcn/ui and Tailwind CSS for a clean, responsive,
  accessible experience across desktop and mobile.
- **Maintainability:** The backend follows a layered (routes → controllers → models)
  architecture with a single global error handler, keeping the codebase easy to extend.
- **Reliability:** Budget alerts use a unique compound index on `(user, category, month,
  threshold)` so re-running detection can never create a duplicate alert.

---

## 5. Need of the Proposed System

A dedicated system like PAISA is needed because manual or fragmented finance tracking leaves the
user unaware of overspending until after it happens, and gives no structured way to plan monthly
spending by category. PAISA is needed for the following reasons:

- **Centralised Record-Keeping:** Every income and expense, whatever the source, is recorded in
  one categorised ledger instead of being scattered across apps, receipts, and memory.
- **Proactive Budget Control:** Automatic 80%/100% threshold detection warns the user before a
  category is over budget, not after.
- **Recurring Obligation Tracking:** Rent, subscriptions, EMIs, and salary are scheduled once and
  auto-posted, removing the risk of a forgotten recurring entry.
- **Multi-Currency Support:** A user who deals in more than one currency can record and view
  their finances in the currency that makes sense to them.
- **Instant Insight:** The Paisa Assistant answers plain-English questions ("How much did I
  spend on food this month?") without the user needing to build a report manually.
- **Data Portability:** CSV import/export means a user is never locked into the platform and can
  migrate data in or out at will.
- **Secure, Private Access:** JWT-based authentication and per-user data scoping ensure a user's
  financial data is visible only to them.

---

## 6. Scope of the Proposed System

The current scope of PAISA focuses on individual personal finance management. It includes:

- **User Management and Authentication** — registration, login, logout, password reset via
  emailed token, and profile updates (name, email, currency).
- **Transaction Management** — full CRUD on income/expense transactions, spending-by-category
  and income/expense/balance summary aggregations, and CSV import/export.
- **Category Management** — global default categories plus user-owned custom categories, each
  unique per `(user, name, type)`.
- **Budget & Alert Engine** — per-category monthly limits, automatic 80%/100% breach detection,
  and an alert inbox with acknowledge/unread-count support.
- **Recurring Transactions** — schedule templates with configurable frequency and interval, a
  materializer that posts all due transactions, and pause/resume support.
- **AI Assistant** — a read-only, Gemini-backed assistant that answers questions about the
  user's own recent transactions, budgets, and categories.
- **Admin Layer** — a dedicated admin role that can list all users with their lifetime totals and
  promote/demote roles.

### Potential Applications

- Individual users tracking personal or household income and expenses.
- Students and young professionals building a monthly budgeting habit.
- Freelancers who need to separate multiple income sources and currencies.

### Exclusions (Future Possibilities)

The current version does not include direct bank-account or card syncing, investment-portfolio
tracking, shared/family accounts, push notifications, or a native mobile app. These remain
potential future enhancements.

---

## 7. Fact Finding Techniques

**1. Interview** — Informal discussions were held among the project team to clarify the exact
set of financial events (income, expense, recurring bill, budget breach) a personal finance app
must model, which shaped the transaction, budget, and alert schema.

**2. Observation** — Common personal budgeting habits (spreadsheets, banking-app statements,
mental tracking) were studied to identify their gaps, which directly motivated the automatic
budget-alert and recurring-transaction features.

**3. Questionnaires** — Informal feedback from prospective users was gathered on which
categories, currencies, and alert thresholds would be most useful, guiding the choice of the
default category list and the 80%/100% thresholds.

**4. Record Searching** — Documentation for comparable personal-finance tools and for the chosen
technology stack (Express, Mongoose, TanStack Query, Google Gemini API) was reviewed to align the
implementation with established patterns and API conventions.

---

## 8. Feasibility Study

**1. Technical Feasibility** — The project uses a modern, well-documented stack: React 19 with
TypeScript and Vite on the front end, and Express 5 with Mongoose 9 on MongoDB for the back end.
JWT handles stateless authentication, and the layered controller/model architecture keeps each
concern isolated, making the system straightforward to build, test, and extend with a small team.

**2. Economic Feasibility** — All core technologies (React, Express, MongoDB, Mongoose) are open
source and free to use. The only optional paid dependency is the Google Gemini API for the AI
assistant, which is usage-based and can be left unconfigured without breaking the rest of the
application. This keeps the project economically viable for an academic or personal deployment.

**3. Operational Feasibility** — The application is designed to be usable without training: the
dashboard surfaces totals and alerts immediately after login, forms are validated inline, and the
sidebar badge highlights unacknowledged alerts.

**4. Schedule Feasibility** — The project was developed within a single-semester academic
timeframe, following a structured progression: schema and API design → backend implementation
(auth, transactions, budgets, alerts, recurring engine) → frontend implementation → AI assistant
integration → testing and documentation.

---

## 9. Hardware and Software Requirements

### Hardware Requirement

- **Processor:** Multi-core processor (Intel Core i5 or AMD Ryzen 5 recommended).
- **RAM:** 8 GB recommended (4 GB minimum for basic testing).
- **Storage:** Minimum 2 GB free disk space for the development environment and dependencies.
- **Network:** Stable internet connection for the MongoDB Atlas connection and the Gemini API.

### Software Requirement

- **Operating System:** Windows 10/11, macOS, or Linux.
- **Backend:** Node.js 20+, Express 5, Mongoose 9, JWT, bcryptjs, Nodemailer.
- **Frontend:** React 19, TypeScript 5.8, Vite 8, React Router 7, TanStack Query, Tailwind CSS
  v4, shadcn/ui (Radix UI), Recharts.
- **Database:** MongoDB (local or MongoDB Atlas).
- **External Services:** Google Gemini API (AI assistant), SMTP email service (password reset).
- **Development Tools:** Visual Studio Code, Postman/Thunder Client, a modern web browser
  (Chrome/Edge/Firefox).

---

## 10. ER Diagram

The data model centres on the **User**. Each User owns a set of Transactions, may define Custom
Categories (in addition to the platform's Global Categories), sets monthly Budgets per category,
receives Budget Alerts when a budget is breached, and can schedule Recurring Transactions that
auto-post real Transactions on a due date.

### Entities and Relationships

```
USER (1) ─── creates ──────► (N) CATEGORY   [custom only; global categories have user = null]
USER (1) ─── records ──────► (N) TRANSACTION
CATEGORY (1) ─── classifies ─► (N) TRANSACTION
USER (1) ─── sets ──────────► (N) BUDGET
CATEGORY (1) ─── limits ────► (N) BUDGET
USER (1) ─── receives ──────► (N) BUDGET_ALERT
CATEGORY (1) ─── triggers ──► (N) BUDGET_ALERT
USER (1) ─── schedules ─────► (N) RECURRING_TRANSACTION
CATEGORY (1) ─── classifies ─► (N) RECURRING_TRANSACTION
```

A compound unique index on `(user, category, month_year)` keeps a Budget one-per-category-per-
month, and a compound unique index on `(user, category, month_year, threshold)` keeps a Budget
Alert one-per-threshold-per-category-per-month, so re-running alert detection is idempotent.

---

## 11. Data Dictionary

The system persists six MongoDB collections, managed through Mongoose schemas.

### 11.1 `users`

| Field | Type | Key / Constraint | Ref | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Primary Key | — | Unique user identifier |
| `name` | String | Required | — | Full name of the user |
| `email` | String | Unique, Required | — | Login email (lowercased) |
| `password` | String | Required, hidden (`select:false`) | — | Bcrypt password hash |
| `passwordConfirm` | String | Required on save (not persisted) | — | Confirmation, validated then discarded |
| `currency` | String (enum) | Default `INR` | — | Display currency; 9 supported |
| `role` | String (enum) | Default `user` | — | `viewer` / `user` / `manager` / `admin` |
| `active` | Boolean | Default `true`, hidden | — | Soft-delete flag |
| `passwordChangedAt` | Date | Set on password change | — | Invalidates old JWTs |
| `passwordResetToken` / `passwordResetExpires` | String / Date | Set on reset request | — | SHA-256 hash of the emailed token, 10-min expiry |

### 11.2 `categories`

| Field | Type | Key / Constraint | Ref | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Primary Key | — | Unique category identifier |
| `name` | String | Required, max 50 chars | — | Category label |
| `type` | String (enum) | Required | — | `income` / `expense` |
| `user` | ObjectId | Nullable | User | `null` = global default category |

Unique compound index: `(user, name, type)`.

### 11.3 `transactions`

| Field | Type | Key / Constraint | Ref | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Primary Key | — | Unique transaction identifier |
| `user` | ObjectId | Required | User | Owning user |
| `category` | ObjectId | Nullable | Category | `null` = uncategorized |
| `amount` | Number | Required, > 0 | — | Always stored positive |
| `type` | String (enum) | Required | — | `income` / `expense` |
| `note` | String | Optional, max 255 chars | — | Free-text note |
| `date` | Date | Required | — | Transaction date |

Index: `(user, date desc)` for the hottest query — "this user's transactions, newest first."

### 11.4 `budgets`

| Field | Type | Key / Constraint | Ref | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Primary Key | — | Unique budget identifier |
| `user` | ObjectId | Required | User | Owning user |
| `category` | ObjectId | Required | Category | Target expense category |
| `month_year` | String | Required, `'YYYY-MM'` | — | Budget month |
| `limit_amount` | Number | Required, > 0 | — | Monthly spending limit |

Unique compound index: `(user, category, month_year)` — enables upsert semantics.

### 11.5 `budget_alerts`

| Field | Type | Key / Constraint | Ref | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Primary Key | — | Unique alert identifier |
| `user` | ObjectId | Required | User | Owning user |
| `category` | ObjectId | Required | Category | Category that breached |
| `month_year` | String | Required, `'YYYY-MM'` | — | Alert month |
| `threshold` | Number (enum) | Required | — | `80` or `100` (percent) |
| `acknowledged` | Boolean | Default `false` | — | Seen/dismissed by user |
| `emailed` | Boolean | Default `false` | — | Alert email already sent |

Unique compound index: `(user, category, month_year, threshold)`.

### 11.6 `recurring_transactions`

| Field | Type | Key / Constraint | Ref | Description |
|---|---|---|---|---|
| `_id` | ObjectId | Primary Key | — | Unique schedule identifier |
| `user` | ObjectId | Required | User | Owning user |
| `category` | ObjectId | Nullable | Category | `null` = uncategorized |
| `type` | String (enum) | Required | — | `income` / `expense` |
| `amount` | Number | Required, > 0 | — | Amount to post each cycle |
| `note` | String | Optional, max 255 | — | Free-text note |
| `frequency` | String (enum) | Required | — | `daily` / `weekly` / `monthly` / `yearly` |
| `interval_count` | Number | Default 1 | — | e.g. "every 2 weeks" |
| `start_date` | String | Required, `'YYYY-MM-DD'` | — | First occurrence |
| `next_run` | String | Required, `'YYYY-MM-DD'` | — | Next date due to post |
| `end_date` | String | Optional, `'YYYY-MM-DD'` | — | Schedule stops after this date |
| `last_run` | String | Optional, `'YYYY-MM-DD'` | — | Date of the most recent auto-post |
| `active` | Boolean | Default `true` | — | `false` = paused / ended |

Index: `(user, active, next_run)` — the hottest query for the materializer.

### Database Relationships

- **User → Transaction / Budget / Budget Alert / Recurring Transaction / Category:**
  one-to-many, scoped by the `user` foreign key on every collection.
- **Category → Transaction / Budget / Budget Alert / Recurring Transaction:** one-to-many, via
  the `category` reference.
- **Ownership enforcement:** the backend's generic CRUD factory folds `user: req.user.id` into
  every query when a resource is marked `userScoped`, so a user can never read or write another
  user's rows (IDOR closed by construction).

---

## 12. DFD / UML Diagrams

### 12.1 Data Flow Diagram — Level 0 (Context Diagram)

The Context Diagram shows PAISA as a single process exchanging data with external entities:

- **Registered User / Admin** — signs up, logs in, manages transactions/budgets/categories,
  views alerts and reports, chats with the AI assistant.
- **Google Gemini API** — receives a prompt built from the user's recent data and returns an
  answer for the Paisa Assistant.
- **SMTP Email Service** — sends password-reset emails.
- **MongoDB Database** — the single system-of-record data store behind the process.

### 12.2 DFD Level 1

The Level 1 DFD decomposes PAISA into eight processes, each reading from and writing to its own
data store:

| # | Process | Data Store(s) |
|---|---|---|
| 1.0 | User Authentication & Account Management | D1 Users |
| 2.0 | Category Management | D2 Categories |
| 3.0 | Transaction Management | D3 Transactions |
| 4.0 | Budget Management | D4 Budgets |
| 5.0 | Budget Alert Engine | D5 Budget Alerts (reads D3, D4) |
| 6.0 | Recurring Transaction Engine | D6 Recurring Transactions (writes D3) |
| 7.0 | AI Assistant (Paisa Assistant) | reads D2, D3, D4 → calls Google Gemini API |
| 8.0 | Admin & Role Management | D1 Users |

### 13. UML Diagrams

UML diagrams represent the structure, behaviour, interactions, and deployment architecture of
PAISA. Ready-made diagram images for this exact project already exist in
`frontend/public/diagrams/` and are referenced below.

**13.1 Use Case Diagram** (`09-usecase-diagram.png`)
Actors: **Registered User**, **Admin**, and a **Guest/Public** visitor. Use cases include
sign up/login, dashboard viewing, transaction & category management, budget & alert handling,
recurring schedules, reports/insights, currency/notification settings, and — for Admin —
viewing all users' totals and granting/revoking roles.

**13.2 Class Diagram** (`01-class-diagram.png`)
Static structure: `User`, `UserRole`, `Category`, `Transaction`, `Budget`, `BudgetAlert`, and
`RecurringTransaction` classes with their attributes, methods (`addTransaction()`,
`setLimit()`, `raiseAlert()`, `scheduleNext()`, …) and one-to-many associations.

**13.3 Object Diagram** (`02-object-diagram.png`)
A snapshot of illustrative instances — one User, a couple of Categories, a Transaction, and a
Budget — showing example (non-real) data only.

**13.4 Activity Diagram** (`04-activity-diagram.png`)
Workflow for adding a transaction: login → open transaction form → fill & submit → backend
validation → save → recompute the category's spent percentage → conditionally raise an 80%/100%
budget alert → updated dashboard.

**13.5 State Chart Diagram** (`05-statechart-diagram.png`)
Lifecycle of a **Budget Alert**: created (unacknowledged) on threshold breach → shown in the
alerts inbox / sidebar badge → acknowledged by the user.

**13.6 Sequence Diagram** (`03-sequence-diagram.png`)
Chronological interaction between the **User**, the **React frontend**, the **Express API**, and
**MongoDB** during the add-transaction and budget-alert-detection workflow.

**13.7 Collaboration / Communication Diagram** (`08-collaboration-diagram.png`)
How the User, Frontend, Express Backend, and MongoDB objects message each other to complete the
add-transaction and alert-detection operation.

**13.8 Component Diagram** (`06-component-diagram.png`)
High-level architecture: React frontend (Auth UI, Dashboard/Transactions UI, Categories &
Budgets UI, Reports UI, Alerts UI) → Express backend (Auth Middleware, Finance Queries, Budget
Alert Engine, CSV Import/Export, Recurring Engine, Email API) → MongoDB + Google Gemini + SMTP.

**13.9 Deployment Diagram** (`07-deployment-diagram.png`)
Physical/logical deployment: **Client Node** (browser running the React SPA) ⇄ **Application
Server** (Node.js/Express, HTTPS/REST) ⇄ **Database Server** (MongoDB), with external HTTPS
calls to the **Google Gemini API** and an **SMTP email service**.

---

## 13. Input / Output Screens

This section catalogs the primary user interfaces of the PAISA application (screenshots live in
`frontend/public/screenshots/`).

| Screen | Purpose | User | Key Functionality |
|---|---|---|---|
| Landing Page | Marketing entry point | All | Navigation, sign up |
| Dashboard | Monthly overview | User | Totals, budget alerts, income vs. expense & category charts |
| Transactions | Manage all entries | User | Filter, add/edit/delete, CSV import/export |
| Recurring | Manage schedules | User | Create, pause, resume schedules; monthly net impact |
| Calendar | Upcoming due items | User | Monthly recurring-bill view, upcoming reminders |
| Categories | Manage categories | User | Add custom categories, view built-in defaults |
| Budgets | Set monthly limits | User | Progress bars, over-budget warnings |
| Reports | Visualise spending | User | Pie / bar charts, monthly trend, top expense |

---

## 14. Limitations

Although PAISA fulfils its primary objectives of personal finance tracking and budget alerting,
several limitations have been identified during development and testing:

- **No direct bank/card sync** — transactions must be entered manually or imported via CSV.
- **Read-only AI assistant** — it can answer questions about existing data but cannot create or
  edit a transaction on the user's behalf.
- **On-request alert detection** — budget alert detection runs when triggered (e.g. via the
  `detect-alerts` endpoint) rather than on a persistent background schedule.
- **On-request recurring materialization** — the recurring-transaction engine must be invoked
  (e.g. by a scheduled job or the client) rather than running as a standing background worker.
- **Single-user accounts** — no household or multi-user shared ledger.
- **No automated test suite or CI/CD pipeline** yet.

---

## 15. Conclusion

The PAISA project successfully demonstrates a functional, secure, full-stack personal finance
tracker. By using a modern technology stack — React 19 and TypeScript on the frontend, Express 5
and Mongoose 9 on MongoDB for the backend — the application delivers categorised transaction
tracking, monthly budgeting with automatic alerts, recurring schedules, multi-currency support,
CSV import/export, and an AI assistant grounded in the user's own data.

While the system meets the requirements of a semester-level field project, it is a foundational
implementation rather than a complete commercial finance platform. The identified limitations —
manual entry instead of bank sync, on-request rather than background alert detection, and the
lack of automated tests — outline clear directions for future work. Planned enhancements include
a background job scheduler for alerts and recurring postings, shared/household accounts, and a
native mobile client. Overall, PAISA establishes a solid, extensible foundation for digital
personal finance management.

---

## 16. Bibliography

1. React Documentation (v19) — https://react.dev/
2. TypeScript Documentation — https://www.typescriptlang.org/docs/
3. Vite Documentation — https://vitejs.dev/
4. TanStack Query Documentation — https://tanstack.com/query/
5. React Router Documentation — https://reactrouter.com/
6. Tailwind CSS Documentation — https://tailwindcss.com/docs/
7. shadcn/ui Documentation — https://ui.shadcn.com/
8. Express Documentation (v5) — https://expressjs.com/
9. Mongoose Documentation (v9) — https://mongoosejs.com/docs/
10. MongoDB Atlas Documentation — https://www.mongodb.com/docs/atlas/
11. JSON Web Tokens (JWT) — https://jwt.io/introduction
12. bcrypt.js Documentation — https://www.npmjs.com/package/bcryptjs
13. Google Gemini API Documentation — https://ai.google.dev/docs
14. Nodemailer Documentation — https://nodemailer.com/
