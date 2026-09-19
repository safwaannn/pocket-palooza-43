/**
 * ============================================================================
 * RECURRING TRANSACTION MODEL
 * ============================================================================
 *
 * A template that auto-posts a real Transaction on its `next_run` date, then
 * advances to the following occurrence. Rent, salary, subscriptions.
 *
 *   frequency + interval_count — "every 2 weeks", "every 1 month", etc.
 *   next_run  — the next date a transaction is due to be created.
 *   last_run  — the date of the most recent auto-post (null until first run).
 *   end_date  — optional; the schedule deactivates once next_run passes it.
 *   active    — false = paused or ended; the materializer ignores it.
 *
 * Dates are stored as 'YYYY-MM-DD' strings (not Date objects) so calendar
 * arithmetic — "add one month" — is exact and never trips over timezones.
 */
const mongoose = require('mongoose');

const recurringSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A schedule must belong to a user'],
    },

    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      default: null,
    },

    type: {
      type: String,
      required: [true, 'A schedule must have a type'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
    },

    amount: {
      type: Number,
      required: [true, 'A schedule must have an amount'],
      min: [0.01, 'Amount must be greater than zero'],
    },

    note: { type: String, trim: true, maxlength: 255, default: null },

    frequency: {
      type: String,
      required: [true, 'A schedule must have a frequency'],
      enum: {
        values: ['daily', 'weekly', 'monthly', 'yearly'],
        message: 'Frequency must be daily, weekly, monthly or yearly',
      },
    },

    interval_count: {
      type: Number,
      default: 1,
      min: [1, 'Interval must be at least 1'],
    },

    start_date: {
      type: String,
      required: [true, 'A schedule must have a start date'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in the format YYYY-MM-DD'],
    },

    next_run: {
      type: String,
      required: [true, 'A schedule must have a next run date'],
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in the format YYYY-MM-DD'],
    },

    end_date: {
      type: String,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in the format YYYY-MM-DD'],
      default: null,
    },

    last_run: {
      type: String,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Dates must be in the format YYYY-MM-DD'],
      default: null,
    },

    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const RecurringTransaction = mongoose.model(
  'RecurringTransaction',
  recurringSchema,
);

module.exports = RecurringTransaction;
