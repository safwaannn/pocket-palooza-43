/**
 * ============================================================================
 * catchAsync — "no more try/catch in every controller"
 * ============================================================================
 *
 * A higher-order function: it takes an async controller and returns a new
 * (req, res, next) handler that forwards any rejection to Express's error
 * pipeline via `.catch(next)`. Without it, every controller would repeat the
 * same try/catch whose only interesting line is `next(err)`.
 *
 *   1. `catchAsync(fn)` — hand it our async controller. It does NOT run it.
 *   2. It returns a new (req, res, next) function — THIS is the route handler.
 *   3. When a request arrives, Express calls it; `fn` runs, and any rejection
 *      is forwarded to the global error handler.
 *
 * The `Promise.resolve(...).catch(next)` normalises the return value, and the
 * surrounding try/catch is a safety net for a synchronous `throw` inside a
 * non-async function — so this is safe to wrap around anything.
 *
 * NOTE: Express 5 auto-forwards rejected promises, so this is technically
 * optional here. We keep it: it is explicit, it also covers sync throws, and it
 * keeps the code portable back to Express 4.
 */
module.exports = (fn) => (req, res, next) => {
  try {
    Promise.resolve(fn(req, res, next)).catch(next);
  } catch (err) {
    next(err);
  }
};
