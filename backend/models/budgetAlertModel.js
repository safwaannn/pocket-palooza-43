/**
 * ============================================================================
 * BUDGET ALERT MODEL
 * ============================================================================
 *
 * A row is created when a category's spending crosses 80% or 100% of its budget
 * in a given month. The compound UNIQUE index on
 * (user, category, month_year, threshold) guarantees each threshold fires at
 * most ONCE per category per month — so re-running detection is idempotent and
 * a user is never spammed with duplicate alerts.
 *
 *   acknowledged — the user has seen/dismissed it (drives the sidebar badge).
 *   emailed      — an alert email has been sent (so we don't re-send).
 */
const mongoose = require('mongoose');

const budgetAlertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'An alert must belong to a user'],
    },

    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      required: [true, 'An alert must reference a category'],
    },

    month_year: {
      type: String,
      required: [true, 'An alert must have a month'],
      match: [/^\d{4}-\d{2}$/, 'month_year must be in the format YYYY-MM'],
    },

    threshold: {
      type: Number,
      required: [true, 'An alert must have a threshold'],
      enum: {
        values: [80, 100],
        message: 'Threshold must be 80 or 100',
      },
    },

    acknowledged: {
      type: Boolean,
      default: false,
    },

    emailed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const BudgetAlert = mongoose.model('BudgetAlert', budgetAlertSchema);

module.exports = BudgetAlert;
