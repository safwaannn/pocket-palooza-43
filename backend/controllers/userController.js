/**
 * ============================================================================
 * USER CONTROLLER
 * ============================================================================
 *
 * TWO GROUPS of routes, kept apart on purpose:
 *   "ME" ROUTES — a logged-in user acting on their OWN account. The id comes
 *                 from `req.user` (the verified token), NEVER from the URL.
 *                 This makes IDOR (editing someone else's account by putting
 *                 their id in the URL) impossible by construction.
 *   ADMIN ROUTES — an admin acting on ANY account (see adminController).
 */
const AppError = require('../utils/appError');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const factory = require('./factoryHandler');

// ALLOW-LIST helper: keep only the permitted keys. Allow-lists fail safe — a new
// sensitive field is excluded until you deliberately add it.
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// GET /users/me — copy the token's user id into params, then reuse getOne.
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

/**
 * PATCH /users/updateMe — update your own name / email / currency.
 * Guard 1: reject password changes here (findByIdAndUpdate skips the hashing
 * hook → would store plain text). Guard 2: filterObj so a client can't send
 * `{ role: 'admin' }` and self-promote. findByIdAndUpdate is fine here because
 * name/email/currency need only schema validators, not a save hook.
 */
exports.updateMe = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updatePassword.',
        400,
      ),
    );
  }

  const filteredBody = filterObj(req.body, 'name', 'email', 'currency');

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    returnDocument: 'after',
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});

/**
 * DELETE /users/deleteMe — soft delete (set active: false). The model's
 * pre(/^find/) hook then hides the user from every query, so soft-deleted is
 * airtight without touching each controller. Hard-deleting would leave dangling
 * references in transactions/budgets/etc. 204 = empty body.
 */
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).send();
});

// getUser is used by the /me route (after getMe fills in params.id).
exports.getUser = factory.getOne(User);
