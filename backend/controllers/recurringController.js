/**
 * ============================================================================
 * RECURRING TRANSACTION CONTROLLER
 * ============================================================================
 *
 * CRUD is user-scoped via the factory. The interesting piece is `materialize`:
 * for every active schedule whose `next_run` is on or before today, it inserts
 * a real Transaction and advances `next_run` — catching up correctly if several
 * periods were missed. This logic used to run on the client; moving it to the
 * server means it works from any device and can be driven by a cron job.
 */
const RecurringTransaction = require('./../models/recurringModel');
const Transaction = require('./../models/transactionModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryHandler');

/* ─────────────────────────────── CRUD ─────────────────────────────────── */
exports.getAllRecurring = factory.getAll(RecurringTransaction, {
  userScoped: true,
});
exports.getRecurring = factory.getOne(RecurringTransaction, {
  userScoped: true,
});
exports.createRecurring = factory.createOne(RecurringTransaction, {
  userScoped: true,
});
exports.updateRecurring = factory.updateOne(RecurringTransaction, {
  userScoped: true,
});
exports.deleteRecurring = factory.deleteOne(RecurringTransaction, {
  userScoped: true,
});

/** Today as 'YYYY-MM-DD' in UTC. */
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Advance a 'YYYY-MM-DD' date by `interval` whole units of `frequency`. We work
 * in UTC and move by calendar units so "monthly" lands on the same day-of-month
 * rather than drifting by a fixed number of days.
 */
const computeNextRun = (from, frequency, interval) => {
  const [y, m, d] = from.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const step = Math.max(1, Math.floor(interval));
  switch (frequency) {
    case 'daily':
      date.setUTCDate(date.getUTCDate() + step);
      break;
    case 'weekly':
      date.setUTCDate(date.getUTCDate() + step * 7);
      break;
    case 'monthly':
      date.setUTCMonth(date.getUTCMonth() + step);
      break;
    case 'yearly':
      date.setUTCFullYear(date.getUTCFullYear() + step);
      break;
    default:
      break;
  }
  return date.toISOString().slice(0, 10);
};

/**
 * POST /recurring-transactions/materialize
 *
 * For each due schedule, post a transaction dated on the run date and advance
 * the cursor. A capped loop (24 passes) lets a schedule that missed several
 * periods catch up, without risking an infinite loop on a misconfigured row.
 * Returns the number of transactions created so the client can toast it.
 */
exports.materialize = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const now = today();
  let created = 0;

  for (let pass = 0; pass < 24; pass += 1) {
    const due = await RecurringTransaction.find({
      user: userId,
      active: true,
      next_run: { $lte: now },
    });
    if (!due.length) break;

    // Sequential await inside the loop is intentional: each schedule's next_run
    // must be advanced before we might process it again in the next pass.
    for (const row of due) {
      const cursor = row.next_run;

      await Transaction.create({
        user: userId,
        category: row.category?._id ?? row.category ?? null,
        type: row.type,
        amount: row.amount,
        note: row.note,
        date: cursor,
      });
      created += 1;

      const nextRun = computeNextRun(cursor, row.frequency, row.interval_count);
      const passedEnd = row.end_date ? nextRun > row.end_date : false;

      row.next_run = nextRun;
      row.last_run = cursor;
      row.active = !passedEnd;
      await row.save({ validateBeforeSave: false });
    }
  }

  res.status(200).json({ status: 'success', data: { created } });
});

// Exposed for reuse/testing.
exports.computeNextRun = computeNextRun;
