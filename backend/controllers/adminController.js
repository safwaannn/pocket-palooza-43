/**
 * ============================================================================
 * ADMIN CONTROLLER
 * ============================================================================
 *
 * Admin-only endpoints, sitting behind protect + restrictTo('admin') in the
 * router. These are the ONLY place a user's role can be changed, and the only
 * place one user can see another's data — deliberately separated from the
 * user-scoped routes so the ownership guarantees elsewhere are never weakened.
 *
 *   getAllUsers    — every user, enriched with their role and lifetime totals.
 *   getMyRoles     — the CURRENT user's roles (used by the front-end RBAC hook).
 *                    Lives here for convenience; it is not itself admin-only —
 *                    see the route wiring.
 *   setUserRole    — promote/demote a user. An admin cannot demote themselves
 *                    (so the last admin can't accidentally lock everyone out).
 */
const mongoose = require('mongoose');
const User = require('./../models/userModel');
const Transaction = require('./../models/transactionModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

/**
 * GET /admin/users
 * Returns each user plus transactionCount / totalIncome / totalExpense, so the
 * admin dashboard can show platform-wide activity. The totals are computed in
 * ONE aggregation grouped by user, then merged onto the user list — far cheaper
 * than a per-user query.
 */
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const [users, totals] = await Promise.all([
    User.find().select('name email role currency createdAt'),
    Transaction.aggregate([
      {
        $group: {
          _id: { user: '$user', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  // Fold the aggregation rows into a per-user summary map.
  const summary = new Map();
  totals.forEach((row) => {
    const uid = row._id.user.toString();
    const s = summary.get(uid) ?? { count: 0, income: 0, expense: 0 };
    s.count += row.count;
    s[row._id.type] += row.total;
    summary.set(uid, s);
  });

  const data = users.map((u) => {
    const s = summary.get(u.id) ?? { count: 0, income: 0, expense: 0 };
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      currency: u.currency,
      createdAt: u.createdAt,
      transactionCount: s.count,
      totalIncome: s.income,
      totalExpense: s.expense,
    };
  });

  res.status(200).json({ status: 'success', results: data.length, data });
});

/**
 * GET /admin/me/roles
 * The front-end RBAC layer expects a list of roles. Our User has a single
 * `role`, so we return it as a one-element array to match that shape.
 */
exports.getMyRoles = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: { roles: [req.user.role] },
  });
});

/**
 * PATCH /admin/users/:id/role  { role }
 * The single source of truth for role changes. An admin may not remove their
 * OWN admin role — that guards against the last admin locking the whole team
 * out. `runValidators` enforces the role enum on the User schema.
 */
exports.setUserRole = catchAsync(async (req, res, next) => {
  const { role } = req.body;
  if (!role) {
    return next(new AppError('Please provide a role', 400));
  }

  if (req.params.id === req.user.id && role !== 'admin') {
    return next(new AppError('You cannot remove your own admin access', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { returnDocument: 'after', runValidators: true },
  ).select('name email role');

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({ status: 'success', data: user });
});
