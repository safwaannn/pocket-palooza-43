/**
 * ============================================================================
 * BUDGET ALERT CONTROLLER
 * ============================================================================
 *
 * Alerts are READ and ACKNOWLEDGED by the user, but created only by the budget
 * detection logic (see budgetController.detectAlerts) — never posted directly.
 * So there is no create/update endpoint here, just:
 *
 *   getAllAlerts    — the user's alerts, newest first (factory, user-scoped)
 *   getUnreadCount  — count of unacknowledged alerts (drives the sidebar badge)
 *   acknowledgeOne  — mark one alert read
 *   acknowledgeAll  — mark every unread alert read
 *   deleteAlert     — remove an alert (factory, user-scoped)
 */
const BudgetAlert = require('./../models/budgetAlertModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryHandler');

exports.getAllAlerts = factory.getAll(BudgetAlert, { userScoped: true });
exports.deleteAlert = factory.deleteOne(BudgetAlert, { userScoped: true });

// GET /budget-alerts/unread-count → { count }
exports.getUnreadCount = catchAsync(async (req, res, next) => {
  const count = await BudgetAlert.countDocuments({
    user: req.user.id,
    acknowledged: false,
  });
  res.status(200).json({ status: 'success', data: { count } });
});

// PATCH /budget-alerts/:id/acknowledge — mark one read (own alerts only).
exports.acknowledgeOne = catchAsync(async (req, res, next) => {
  const alert = await BudgetAlert.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { acknowledged: true },
    { returnDocument: 'after' },
  );

  if (!alert) {
    return next(new AppError('No alert found with that ID', 404));
  }

  res.status(200).json({ status: 'success', data: alert });
});

// POST /budget-alerts/acknowledge-all — mark all the user's unread alerts read.
exports.acknowledgeAll = catchAsync(async (req, res, next) => {
  const result = await BudgetAlert.updateMany(
    { user: req.user.id, acknowledged: false },
    { acknowledged: true },
  );

  res.status(200).json({
    status: 'success',
    data: { modified: result.modifiedCount ?? 0 },
  });
});
