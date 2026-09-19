/**
 * ============================================================================
 * HANDLER FACTORY — one generic CRUD implementation for every resource
 * ============================================================================
 *
 * "Delete a transaction by id", "delete a budget by id", "delete a category by
 * id" are the same handful of lines differing only in the model. The factory
 * writes them once. Each `factory.deleteOne(Model)` runs at startup and returns
 * the actual `(req, res, next)` handler, with the model captured in a closure.
 *
 * ── THE FINANCE-APP TWIST: OWNERSHIP SCOPING ──────────────────────────────
 * Unlike the natours tours (which are public), almost everything here belongs
 * to a specific user: your transactions, your budgets, your categories. A user
 * must never read or write another user's rows. So every factory handler below
 * accepts an options object and, when `{ userScoped: true }` is passed, folds
 * `user: req.user.id` into the query.
 *
 * This is the ownership equivalent of natours' `restrictToOwner`, but pushed
 * into the data layer so it is impossible to forget: a scoped `findOne({ _id,
 * user })` simply returns null for someone else's document, which becomes a
 * clean 404 — the row effectively does not exist for anyone but its owner. That
 * closes the entire IDOR (Insecure Direct Object Reference) class of bug by
 * construction.
 *
 * Admins bypass scoping via their own dedicated admin routes, never these.
 */
const APIFeatures = require('../utils/apiFeatures');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

// Build the base filter for a request. When userScoped, restrict to the caller.
const ownerFilter = (req, userScoped) =>
  userScoped ? { user: req.user.id } : {};

/**
 * DELETE ONE — 204 No Content, empty body.
 * `findOneAndDelete` (not `findByIdAndDelete`) so we can AND the owner into the
 * query: someone else's id resolves to null → 404, never a cross-user delete.
 */
exports.deleteOne = (Model, { userScoped = false } = {}) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findOneAndDelete({
      _id: req.params.id,
      ...ownerFilter(req, userScoped),
    });

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(204).send();
  });


/**
 * UPDATE ONE (PATCH).
 * `returnDocument: 'after'` returns the NEW doc; `runValidators: true` re-runs
 * schema validators (off by default — without it a PATCH could set a negative
 * amount). Owner is part of the query, not the update.
 */
exports.updateOne = (Model, { userScoped = false } = {}) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findOneAndUpdate(
      { _id: req.params.id, ...ownerFilter(req, userScoped) },
      req.body,
      { returnDocument: 'after', runValidators: true },
    );

    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({ status: 'success', data: doc });
  });


/**
 * CREATE ONE (POST) — 201 Created.
 * When userScoped we stamp `user: req.user.id` from the TOKEN, never from the
 * body — so a client can't create a row attributed to someone else. Any
 * client-supplied `user` in the body is overwritten.
 */
exports.createOne = (Model, { userScoped = false } = {}) =>
  catchAsync(async (req, res, next) => {
    const payload = userScoped
      ? { ...req.body, user: req.user.id }
      : req.body;

    const doc = await Model.create(payload);
    res.status(201).json({ status: 'success', data: doc });
  });


/**
 * GET ONE. Optional `popOptions` chains a `.populate()`. Owner-scoped by query.
 */
exports.getOne = (Model, { userScoped = false, popOptions } = {}) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findOne({
      _id: req.params.id,
      ...ownerFilter(req, userScoped),
    });
    if (popOptions) query = query.populate(popOptions);

    const doc = await query;
    if (!doc) {
      return next(new AppError('No document found with that ID', 404));
    }
    res.status(200).json({ status: 'success', data: doc });
  });


/**
 * GET ALL. The APIFeatures chain (filter/sort/limitFields/paginate) all comes
 * from the URL; the DB is hit once at the await. The base filter starts from the
 * owner scope, so a user's list can never include another user's rows.
 *
 * `results` is the count of THIS PAGE, not the grand total (a total would cost a
 * second countDocuments() query on every request — add it only if the UI needs
 * "page 3 of 12").
 */
exports.getAll = (Model, { userScoped = false, popOptions } = {}) =>
  catchAsync(async (req, res, next) => {
    const features = new APIFeatures(
      Model.find(ownerFilter(req, userScoped)),
      req.query,
    )
      .filter()
      .sort()
      .limitFields()
      .paginate();

    if (popOptions) features.query = features.query.populate(popOptions);

    const doc = await features.query;

    res.status(200).json({
      status: 'success',
      results: doc.length,
      page: features.page,
      limit: features.limit,
      data: doc,
    });
  });
