/**
 * ============================================================================
 * CATEGORY CONTROLLER
 * ============================================================================
 *
 * Categories are a hybrid of global + user-owned, so the generic factory does
 * not quite fit the list/create/delete semantics — these are written by hand:
 *
 *   getAllCategories — returns GLOBAL defaults (user: null) PLUS the caller's
 *                      own custom categories, in one list.
 *   createCategory   — always creates a category owned by the caller.
 *   updateCategory   — only the caller's OWN categories; a global default is
 *                      immutable (returns 404 for this user, never edited).
 *   deleteCategory   — same ownership rule.
 *
 * The ownership filter (`user: req.user.id`) on update/delete is what stops one
 * user touching another user's — or a global — category (IDOR protection).
 */
const Category = require('./../models/categoryModel');
const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');

// GET /categories — globals + this user's own, income first then by name.
exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find({
    $or: [{ user: null }, { user: req.user.id }],
  }).sort('type name');

  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: categories,
  });
});

// POST /categories — create a category owned by the caller. `user` comes from
// the token, never the body, so nobody can create a global (user: null) or a
// category attributed to someone else.
exports.createCategory = catchAsync(async (req, res, next) => {
  const category = await Category.create({
    name: req.body.name,
    type: req.body.type,
    user: req.user.id,
  });

  res.status(201).json({ status: 'success', data: category });
});

// PATCH /categories/:id — only the caller's OWN category. Global defaults
// (user: null) and other users' categories won't match, so they 404.
exports.updateCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { name: req.body.name, type: req.body.type },
    { returnDocument: 'after', runValidators: true },
  );

  if (!category) {
    return next(
      new AppError('No editable category found with that ID', 404),
    );
  }

  res.status(200).json({ status: 'success', data: category });
});

// DELETE /categories/:id — same ownership rule as update.
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!category) {
    return next(
      new AppError('No deletable category found with that ID', 404),
    );
  }

  res.status(204).send();
});
