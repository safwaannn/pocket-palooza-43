/**
 * ============================================================================
 * BUDGET MODEL
 * ============================================================================
 *
 * One budget per (user, category, month). `month_year` is a 'YYYY-MM' string —
 * a budget is a monthly spending limit for a single expense category.
 *
 * The compound unique index enforces "at most one budget per category per
 * month per user", which is what lets the controller safely UPSERT: setting a
 * limit twice updates the existing row rather than creating a duplicate.
 */
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A budget must belong to a user'],
    },

    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'A budget must target a category'],
    },

    // 'YYYY-MM'. Validated by pattern so a malformed month can't slip in and
    // silently never match a spending query.
    month_year: {
      type: String,
      required: [true, 'A budget must have a month'],
      match: [/^\d{4}-\d{2}$/, 'month_year must be in the format YYYY-MM'],
    },

    limit_amount: {
      type: Number,
      required: [true, 'A budget must have a limit'],
      min: [0.01, 'A budget limit must be greater than zero'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Budget = mongoose.model('Budget', budgetSchema);

module.exports = Budget;
