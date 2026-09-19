/**
 * ============================================================================
 * BUDGET CONTROLLER
 * ============================================================================
 *
 * Budgets are user-scoped. `getAll`, `getOne`, and `delete` come from the
 * factory. `createBudget` is hand-written because setting a budget is an UPSERT
 * (one per category per month), and `detectAlerts` implements the 80%/100%
 * threshold logic that used to live in the front-end `budget-alerts.ts`.
 */
const mongoose = require('mongoose');
const Budget = require('./../models/budgetModel');
const BudgetAlert = require('./../models/budgetAlertModel');
const Transaction = require('./../models/transactionModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryHandler');

/* ─────────────────── list / read / delete via factory ─────────────────── */
exports.getAllBudgets = factory.getAll(Budget, { userScoped: true });
exports.getBudget = factory.getOne(Budget, { userScoped: true });
exports.deleteBudget = factory.deleteOne(Budget, { userScoped: true });

/**
 * POST /budgets — set (or update) the limit for a (category, month).
 *
 * UPSERT rather than plain create: the unique index means a second POST for the
 * same category+month would otherwise throw a duplicate-key error. Upserting
 * makes "set a budget" idempotent — the UI can call it whether or not one
 * already exists. `user` comes from the token, never the body.
 */
exports.createBudget = catchAsync(async (req, res, next) => {
  const { category, month_year, limit_amount } = req.body;

  if (!category || !month_year || limit_amount == null) {
    return next(
      new AppError('Provide category, month_year and limit_amount', 400),
    );
  }

  const budget = await Budget.findOneAndUpdate(
    { user: req.user.id, category, month_year },
    { limit_amount },
    {
      returnDocument: 'after',
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  res.status(201).json({ status: 'success', data: budget });
});


/**
 * Month bounds helper — [start, end) so the last day of the month is fully
 * included (see the note in transactionController).
 */
const monthBounds = (monthYear) => {
  const [year, month] = monthYear.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
};

/**
 * POST /budgets/detect-alerts?month_year=YYYY-MM  (defaults to current month)
 *
 * For each of the user's budgets this month, compute spent% and create an alert
 * row for any newly-crossed 80%/100% threshold. The unique index makes inserts
 * idempotent, so we only report the alerts that were actually NEW this call
 * (for toast notifications on the client).
 *
 * Steps:
 *   1. Load this month's budgets and this month's expense totals per category.
 *   2. For each budget, work out which thresholds are crossed.
 *   3. Find which of those already exist, insert the rest, return the new ones.
 */
exports.detectAlerts = catchAsync(async (req, res, next) => {
  const monthYear =
    req.query.month_year || new Date().toISOString().slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(monthYear)) {
    return next(new AppError('month_year must be in the format YYYY-MM', 400));
  }

  const userId = req.user.id;
  const { start, end } = monthBounds(monthYear);

  // 1) budgets + spending, in parallel
  const [budgets, spendingRows] = await Promise.all([
    Budget.find({ user: userId, month_year: monthYear }),
    Transaction.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: start, $lt: end },
        },
      },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);

  if (!budgets.length) {
    return res.status(200).json({ status: 'success', data: [] });
  }

  const spent = {};
  spendingRows.forEach((row) => {
    if (row._id) spent[row._id.toString()] = row.total;
  });

  // 2) which thresholds are crossed?
  const candidates = []; // { category, threshold, categoryName }
  budgets.forEach((budget) => {
    const catId = budget.category?._id?.toString() ?? budget.category.toString();
    const used = spent[catId] ?? 0;
    const pct = (used / budget.limit_amount) * 100;
    const name = budget.category?.name ?? 'Category';

    [80, 100].forEach((threshold) => {
      if (pct >= threshold) {
        candidates.push({ category: catId, threshold, categoryName: name });
      }
    });
  });

  if (!candidates.length) {
    return res.status(200).json({ status: 'success', data: [] });
  }

  // 3) find existing so we can return only the freshly-created ones
  const existing = await BudgetAlert.find({
    user: userId,
    month_year: monthYear,
  }).select('category threshold');

  const existingKeys = new Set(
    existing.map(
      (a) =>
        `${(a.category?._id ?? a.category).toString()}:${a.threshold}`,
    ),
  );

  const fresh = candidates.filter(
    (c) => !existingKeys.has(`${c.category}:${c.threshold}`),
  );

  if (fresh.length) {
    // ordered:false so one duplicate (a race with another tab) doesn't abort
    // the whole insert.
    await BudgetAlert.insertMany(
      fresh.map((c) => ({
        user: userId,
        category: c.category,
        month_year: monthYear,
        threshold: c.threshold,
      })),
      { ordered: false },
    ).catch(() => {
      /* duplicate-key races are expected and harmless here */
    });
  }

  res.status(200).json({
    status: 'success',
    results: fresh.length,
    data: fresh.map((c) => ({
      categoryName: c.categoryName,
      threshold: c.threshold,
    })),
  });
});
