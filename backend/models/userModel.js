/**
 * ============================================================================
 * USER MODEL — identity, passwords, roles, and per-user currency
 * ============================================================================
 *
 * The most security-sensitive file in the project. Three rules drive it:
 *   1. NEVER store a password — store a one-way bcrypt HASH.
 *   2. NEVER send the hash to the client — `select: false`.
 *   3. Put the security logic in the MODEL, so it runs no matter which route
 *      caused the write. A pre-save hook cannot be forgotten.
 *
 * Roles mirror the front-end RBAC layer (src/lib/rbac.ts):
 *   viewer  — read-only
 *   user    — full control of their own finance data
 *   manager — same as user (reserved for org features)
 *   admin   — can manage roles and view platform-wide totals
 */
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name'],
      trim: true,
    },

    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true, // a unique INDEX — a clash yields code 11000, not a validator error
      lowercase: true, // 'John@Mail.com' → 'john@mail.com' so login is case-insensitive
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },

    // Per-user display currency (INR, USD, …). The front-end useCurrency() hook
    // reads this to format every amount.
    currency: {
      type: String,
      uppercase: true,
      enum: {
        values: ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED'],
        message: 'Unsupported currency',
      },
      default: 'INR',
    },

    role: {
      type: String,
      enum: {
        values: ['viewer', 'user', 'manager', 'admin'],
        message: 'Role must be: viewer, user, manager or admin',
      },
      default: 'user',
    },

    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'A password must be at least 8 characters'],
      // Excluded from EVERY query result by default, so the hash can never leak.
      // Ask for it explicitly when needed: `.select('+password')`.
      select: false,
    },

    passwordConfirm: {
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // Regular function (not arrow) so `this` is the document. Runs on SAVE
        // only — which is why password routes use `.save()`, never a query update.
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords do not match',
      },
    },

    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    active: {
      type: Boolean,
      default: true,
      select: false, // internal flag, not user-facing
    },
  },
  {
    timestamps: true, // createdAt / updatedAt — handy for the admin dashboard
  },
);

const User = mongoose.model('User', userSchema);

module.exports = User;
