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
