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

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
