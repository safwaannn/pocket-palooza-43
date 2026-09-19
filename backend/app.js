/**
 * ============================================================================
 * app.js — THE EXPRESS APPLICATION
 * ============================================================================
 *
 * Everything about HANDLING requests: middleware and route mounting. Kept
 * separate from server.js (which RUNS the process) so the app can be imported
 * without starting a server.
 *
 * ⚠️ THE MOST IMPORTANT CONCEPT: THE MIDDLEWARE STACK. Express is a list of
 * functions a request walks through IN ORDER. `app.use()` calls run in the
 * sequence written, so misplacing one line can silently disable it. The
 * ordering below is deliberate and commented.
 */
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { xss } = require('express-xss-sanitizer');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

const userRouter = require('./routes/userRoutes');
const categoryRouter = require('./routes/categoryRoutes');
const transactionRouter = require('./routes/transactionRoutes');
const budgetRouter = require('./routes/budgetRoutes');
const budgetAlertRouter = require('./routes/budgetAlertRoutes');
const recurringRouter = require('./routes/recurringRoutes');
const adminRouter = require('./routes/adminRoutes');
const aiRouter = require('./routes/aiRoutes');

const app = express();

// Express 5 defaults to the 'simple' query parser, which does NOT build nested
// objects. Our API relies on `?amount[gte]=500` arriving as
// `{ amount: { gte: '500' } }`. 'extended' restores Express 4 behaviour.
app.set('query parser', 'extended');

// Behind a proxy (Render, Heroku, nginx) trust the first hop so the rate
// limiter sees the real client IP rather than the proxy's.
app.set('trust proxy', 1);

/* ══════════════════════════ 1. GLOBAL MIDDLEWARE ═════════════════════════ */

// SECURITY HEADERS — first, always. A header only protects responses that pass
// through it after it was registered.
app.use(helmet());

// REQUEST LOGGING — dev only. In production this is a measurable stdout cost
// and morgan logs full URLs (which may contain tokens in query params).
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

/**
 * --- CORS ----------------------------------------------------------------
 * The front-end (TanStack Start, http://localhost:5173) is a different origin
 * from this API, so the browser blocks requests unless we opt in. We reflect a
 * single allowed origin (never `*` together with credentials) and allow cookies
 * so the httpOnly JWT cookie round-trips.
 *
 * Hand-written to avoid an extra dependency — the cors package does little more
 * than this for a single-origin setup.
 */
app.use((req, res, next) => {
  const allowedOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header(
    'Access-Control-Allow-Methods',
    'GET,POST,PATCH,DELETE,PUT,OPTIONS',
  );
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization',
  );
  // Preflight requests end here — no need to run them through the whole stack.
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// STATIC FILES — anything in /public served from the web root.
app.use(express.static(path.join(__dirname, 'public')));

// RATE LIMITING — in development the limit is higher so heavy local testing
// doesn't hit 429. In production the limit is much tighter (100/hour).
const isDevEnv = process.env.NODE_ENV === 'development';
const limiter = rateLimit({
  max: isDevEnv ? 1000 : 100,
  windowMs: 60 * 60 * 1000,
  standardHeaders: true,
  message: 'Too many requests from this IP, please try again in an hour.',
});
app.use('/api', limiter);

// BODY PARSER — reads JSON onto req.body. `limit` rejects oversized bodies with
// a 413, preventing a trivial memory-exhaustion DoS.
app.use(express.json({ limit: '10kb' }));

// COOKIE PARSER (hand-written) — reads the Cookie header into req.cookies so
// authController.protect can read the httpOnly jwt cookie. Split each pair on
// the FIRST '=' only (a JWT contains dots and '=' padding).
app.use((req, res, next) => {
  req.cookies = {};
  const header = req.headers.cookie;
  if (header) {
    header.split(';').forEach((pair) => {
      const index = pair.indexOf('=');
      if (index < 0) return;
      const key = pair.slice(0, index).trim();
      const value = pair.slice(index + 1).trim();
      try {
        req.cookies[key] = decodeURIComponent(value);
      } catch {
        req.cookies[key] = value;
      }
    });
  }
  next();
});

// NoSQL INJECTION SANITISATION — strips keys starting with `$` or containing
// `.` from body and query. Stops `{ "email": { "$gt": "" } }` auth-bypass
// attacks. The manual wrapper is required because in Express 5 `req.query` is a
// lazy getter with no setter, so the library's normal assignment throws.
app.use((req, res, next) => {
  req.body = mongoSanitize.sanitize(req.body);
  Object.defineProperty(req, 'query', {
    value: mongoSanitize.sanitize(req.query),
    writable: true,
    configurable: true,
  });
  next();
});

// XSS SANITISATION — strips HTML/script tags from incoming data, stopping
// stored XSS (e.g. a `<script>` tag saved as a transaction note).
app.use(xss());

// PARAMETER POLLUTION — `?sort=a&sort=b` becomes an array and crashes code that
// expects a string. hpp keeps the last occurrence; the whitelist names fields
// where duplicates are legitimate. MUST come after the body parser/sanitisers.
app.use(
  hpp({
    whitelist: ['type', 'date', 'amount', 'category', 'month_year', 'threshold'],
  }),
);

// A custom middleware, as an example: stamp each request with its arrival time.
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

/* ═══════════════════════════════ 2. ROUTES ═══════════════════════════════ */
// Every path is versioned under /api/v1/ so a future breaking change can ship
// as /api/v2/ while existing clients keep working.
app.use('/api/v1/users', userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/transactions', transactionRouter);
app.use('/api/v1/budgets', budgetRouter);
app.use('/api/v1/budget-alerts', budgetAlertRouter);
app.use('/api/v1/recurring-transactions', recurringRouter);
app.use('/api/v1/admin', adminRouter);
app.use('/api/v1/ai', aiRouter);

// A tiny health-check, handy for uptime monitors and load balancers.
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'success', time: req.requestTime });
});

/* ══════════════════════ 3. 404 — UNMATCHED ROUTES ═══════════════════════ */
// Anything reaching here matched no route above. Must come AFTER all routes.
app.all('/{*splat}', (req, res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

/* ═════════════════════ 4. GLOBAL ERROR HANDLER ══════════════════════════ */
// The LAST app.use — Express only routes errors to a handler registered AFTER
// the code that produced them.
app.use(globalErrorHandler);

module.exports = app;
