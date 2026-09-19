/**
 * ============================================================================
 * GLOBAL ERROR HANDLING MIDDLEWARE
 * ============================================================================
 *
 * Every error in the whole application ends up in this ONE function, because a
 * middleware with FOUR parameters `(err, req, res, next)` is recognised by
 * Express as an error handler. Three params = normal middleware; `next` must
 * stay in the signature even though we never call it.
 *
 * This gives us: consistent error shapes (one front-end error path), a single
 * security boundary (what we hide in production), and clean controllers (a
 * controller just calls `next(new AppError(...))`).
 */
const AppError = require('./../utils/appError');

/* ═══ PART 1 — TRANSLATORS: ugly technical errors → friendly AppErrors ═══ */

// CastError — Mongoose could not convert a value to the schema's type. Almost
// always a malformed ObjectId, e.g. GET /transactions/not-a-real-id.
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// Duplicate key — MongoDB error code 11000 (a `unique` index clashed). The
// driver gives us `err.keyValue`, an object of the fields that clashed — no
// fragile regex on the error message needed.
const handleDuplicateFieldsDB = (err) => {
  const keyValue = err.keyValue ?? {};
  const fields = Object.keys(keyValue).join(', ');
  const values = Object.values(keyValue).join(', ');
  const message = fields
    ? `Duplicate value for ${fields}: "${values}". Please use another value.`
    : 'Duplicate field value. Please use another value.';
  return new AppError(message, 400);
};

// ValidationError — one or more schema rules failed. Report every field at once.
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// The exact library error names matter — these are the real strings the
// jsonwebtoken package throws.
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again.', 401);


/* ═══ PART 2 — SENDERS: dev gets everything, prod gets only what's safe ═══ */

const sendErrorDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, req, res) => {
  // isOperational === true → an error WE created with AppError. Safe to send.
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  // An unexpected bug or unrecognised library error. Log the full thing
  // server-side (this is where you'd report to Sentry/Datadog), send a generic
  // message to the client so we don't leak internals.
  console.error('💥 UNEXPECTED ERROR:', err);
  return res.status(500).json({
    status: 'error',
    message: 'Something went very wrong. Please try again later.',
  });
};
