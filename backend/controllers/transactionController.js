/**
 * ============================================================================
 * TRANSACTION CONTROLLER
 * ============================================================================
 *
 * The five CRUD handlers come from the factory, all `userScoped` so a user can
 * only ever touch their own transactions. Two aggregation endpoints are
 * transaction-specific and written by hand:
 *
 *   getMonthlySpending — expense total per category for a given month. Powers
 *                        the front-end `useMonthlySpending` hook and budget
 *                        progress bars.
 *   getSummary         — income / expense / balance totals for a date range.
 */
const Transaction = require('./../models/transactionModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryHandler');
const mongoose = require('mongoose');

/* ─────────────────────────────── CRUD ─────────────────────────────────── */
exports.getAllTransactions = factory.getAll(Transaction, { userScoped: true });
exports.getTransaction = factory.getOne(Transaction, { userScoped: true });
exports.createTransaction = factory.createOne(Transaction, {
  userScoped: true,
});
exports.updateTransaction = factory.updateOne(Transaction, {
  userScoped: true,
});
exports.deleteTransaction = factory.deleteOne(Transaction, {
  userScoped: true,
});

/**
 * Compute the inclusive [start, end] Date bounds for a 'YYYY-MM' month string.
 * Uses `< firstOfNextMonth` internally to avoid the classic off-by-one where a
 * `<=` on the last day excludes most of that day.
 */
const monthBounds = (monthYear) => {
  const [year, month] = monthYear.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1)); // first of next month
  return { start, end };
};

/**
 * GET /transactions/spending?month_year=YYYY-MM
 * → { "<categoryId>": <expenseTotal>, ... }
 *
 * Aggregation pipeline, run in the database (not in Node):
 *   $match  — this user's EXPENSES within the month. $match first = fewest docs
 *             flow through later stages, and it can use the (user, date) index.
 *   $group  — sum amount per category.
 */
exports.getMonthlySpending = catchAsync(async (req, res, next) => {
  const monthYear = req.query.month_year;
  if (!monthYear || !/^\d{4}-\d{2}$/.test(monthYear)) {
    return next(
      new AppError('Provide month_year in the format YYYY-MM', 400),
    );
  }

  const { start, end } = monthBounds(monthYear);

  const rows = await Transaction.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(req.user.id),
        type: 'expense',
        date: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
      },
    },
  ]);

  // Shape into the { categoryId: total } map the front-end expects.
  const spending = {};
  rows.forEach((row) => {
    if (row._id) spending[row._id.toString()] = row.total;
  });

  res.status(200).json({ status: 'success', data: spending });
});


/**
 * GET /transactions/summary?start=YYYY-MM-DD&end=YYYY-MM-DD
 * → { income, expense, balance }  (balance = income − expense)
 *
 * The date range is optional; without it, all of the user's transactions count.
 */
exports.getSummary = catchAsync(async (req, res, next) => {
  const match = { user: new mongoose.Types.ObjectId(req.user.id) };
  if (req.query.start || req.query.end) {
    match.date = {};
    if (req.query.start) match.date.$gte = new Date(req.query.start);
    if (req.query.end) match.date.$lte = new Date(req.query.end);
  }

  const rows = await Transaction.aggregate([
    { $match: match },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);

  const totals = { income: 0, expense: 0 };
  rows.forEach((row) => {
    totals[row._id] = row.total;
  });
  totals.balance = totals.income - totals.expense;

  res.status(200).json({ status: 'success', data: totals });
});
