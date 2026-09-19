/**
 * ============================================================================
 * AppError — our own custom Error class
 * ============================================================================
 *
 * An HTTP API needs more than a message on its errors. It needs:
 *   1. WHICH status code to send back (404? 400? 500?)
 *   2. Is this a "normal" error we EXPECTED (bad input, wrong password),
 *      or a real BUG in our code (typo, reading a property of undefined)?
 *
 * We tag our own errors with `isOperational = true`, meaning "this is a
 * predictable, human-caused problem — it is safe to show the user". Anything
 * that reaches the global error handler WITHOUT that flag is treated as a
 * programming bug → a generic 500 for the client, full details logged only on
 * the server. See controllers/errorController.js.
 *
 * USAGE:  return next(new AppError('No transaction found with that ID', 404));
 *
 * Always `return next(...)`. Without `return`, the function keeps running and
 * you get "Cannot set headers after they are sent to the client".
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    // 4xx = the CLIENT did something wrong → 'fail'; 5xx = the SERVER → 'error'.
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    // Begin the stack trace at the `new AppError(...)` call site, not here.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
