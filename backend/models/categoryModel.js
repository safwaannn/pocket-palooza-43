/**
 * ============================================================================
 * CATEGORY MODEL
 * ============================================================================
 *
 * A category is either GLOBAL (a built-in like "Food" or "Salary", `user: null`)
 * or CUSTOM (created by one user, `user: <id>`). The controller's list query
 * therefore returns both the global defaults AND the caller's own categories.
 *
 * The compound unique index prevents the same user creating two categories with
 * the same (name, type). Global categories are seeded once at signup.
 */
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A category must have a name'],
      trim: true,
      maxlength: [50, 'A category name must be 50 characters or fewer'],
    },

    type: {
      type: String,
      required: [true, 'A category must have a type'],
      enum: {
        values: ['income', 'expense'],
        message: 'Type must be either income or expense',
      },
    },

    // null = a global/default category available to everyone. Otherwise the
    // owner. Ref lets us populate if ever needed.
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// A user cannot have two categories with the same name + type. Global
// categories (user: null) are likewise unique per name+type. `partialFilter`
// is not needed — null participates in the index like any other value.
categorySchema.index({ user: 1, name: 1, type: 1 }, { unique: true });

const Category = mongoose.model('Category', categorySchema);

/**
 * The default categories seeded for the whole platform. Kept here so both the
 * signup flow and any seed script share one source of truth.
 */
Category.DEFAULTS = [
  { name: 'Salary', type: 'income' },
  { name: 'Business', type: 'income' },
  { name: 'Investment', type: 'income' },
  { name: 'Gift', type: 'income' },
  { name: 'Food', type: 'expense' },
  { name: 'Rent', type: 'expense' },
  { name: 'Transport', type: 'expense' },
  { name: 'Utilities', type: 'expense' },
  { name: 'Entertainment', type: 'expense' },
  { name: 'Health', type: 'expense' },
  { name: 'Shopping', type: 'expense' },
  { name: 'Savings', type: 'expense' },
];

module.exports = Category;
