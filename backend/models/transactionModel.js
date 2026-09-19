/**
 * ============================================================================
 * TRANSACTION MODEL
 * ============================================================================
 *
 * Every income or expense entry. Belongs to a user and (optionally) a category.
 * Amount is always stored POSITIVE; the `type` field ('income' | 'expense')
 * gives it direction. That keeps aggregation simple and avoids sign-handling
 * bugs.
 *
 * The category is populated on read via a query hook, so the API returns the
 * category name/type inline — matching the front-end's `transaction.category`
 * shape.
 */
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A transaction must belong to a user'],
    },

    category: {
      type: mongoose.Schema.ObjectId,
      ref: 'Category',
      // Optional — a transaction can be uncategorized (e.g. after its category
      // was deleted). The UI shows "Uncategorized" in that case.
      default: null,
    },

    amount: {
      type: Number,
      required: [true, 'A transaction must have an amount'],
      min: [0.01, 'Amount must be greater than zero'],
    },

    type: {
      type: String,
      required: [true, 'A transaction must have a type'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
    },

    note: {
      type: String,
      trim: true,
      maxlength: [255, 'A note must be 255 characters or fewer'],
      default: null,
    },

    // Stored as a Date; the API accepts and returns 'YYYY-MM-DD'.
    date: {
      type: Date,
      required: [true, 'A transaction must have a date'],
      default: Date.now,
    },
  },
  {
    timestamps: true, // createdAt used as a secondary sort key
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
