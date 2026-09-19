/**
 * ============================================================================
 * AUTH CONTROLLER — signup, login, and the guards that protect everything
 * ============================================================================
 *
 * JWT authentication in plain terms: log in once with email + password, receive
 * a signed token, then present that token on every later request. The token is
 * SIGNED (tamper-proof) but NOT encrypted — anyone can read its payload — so we
 * store only the user id in it and re-fetch the user from the DB on every
 * request. That also means a role change or account deletion takes effect
 * immediately, not at token expiry.
 */
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');

const catchAsync = require('./../utils/catchAsync');
const sendEmail = require('./../utils/email');
const User = require('./../models/userModel');
const AppError = require('./../utils/appError');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIREIN,
  });

/**
 * Create a token, set it in an httpOnly cookie, and send it in the JSON body.
 *   - cookie is for browsers (JS cannot read httpOnly cookies → XSS-safe)
 *   - body token is for API clients using `Authorization: Bearer ...`
 */
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIREIN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true, // JS cannot read it — defence against token theft via XSS
    sameSite: 'strict', // not attached to cross-site requests — CSRF defence
  };
  // Only send over HTTPS in production (localhost is HTTP, so not in dev).
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  res.cookie('jwt', token, cookieOptions);

  // Never leak the hash. In-memory only — we are not saving here.
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: { user },
  });
};

/**
 * SIGN UP. Note the ALLOW-LIST: we pick fields explicitly rather than passing
 * `req.body`, so a client cannot send `{ "role": "admin" }` and self-promote
 * (a mass-assignment / privilege-escalation hole). `role` falls back to the
 * schema default 'user'. We also seed the new user's default categories.
 */
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  createSendToken(newUser, 201, res);
});

/**
 * LOG IN. Three checks, each with a security reason:
 *   1. Both fields present (else bcrypt gets undefined → 500).
 *   2. `.select('+password')` because the field is `select: false`.
 *   3. One combined message for "no user" vs "wrong password" — separate
 *      messages enable USER ENUMERATION. `||` short-circuits so we never call
 *      correctPassword on a null user. 401, not 403.
 */
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  createSendToken(user, 200, res);
});

/**
 * LOG OUT. A JWT can't be invalidated server-side, so "logging out" means
 * removing the client's copy: overwrite the cookie with a junk value that
 * expires in 10 seconds. API clients simply discard their token.
 */
exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};


/**
 * `protect` — THE GATEKEEPER. Put it in front of a route to require a login;
 * it also sets `req.user` for everything downstream.
 *   1. Find the token (Authorization header OR jwt cookie).
 *   2. Verify it (jwt.verify; bad/expired tokens → clean 401s via errorController).
 *   3. Does the user still exist? (token outlives a deleted account otherwise)
 *   4. Was the password changed after the token was issued? ("log out everywhere")
 */
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please log in to get access.', 401),
    );
  }

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401),
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401),
    );
  }

  req.user = currentUser;
  next();
});

/**
 * `restrictTo` — AUTHORISATION. Must come AFTER `protect` (it reads
 * `req.user.role`). Returns a middleware with the allowed roles captured in a
 * closure. 403 Forbidden: we know who you are, and the answer is still no.
 */
exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }
    next();
  };


/**
 * FORGOT PASSWORD — email a one-time reset link. We store only the HASH of the
 * token; the plain token goes in the email. The try/catch is the point: we have
 * already saved the token, so if the email fails we must roll it back, or the
 * user has a live token they never received.
 */
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Point at the FRONT-END reset page (not the raw API endpoint). The page
  // reads the token from the query string and PATCHes the API for the user.
  // Falls back to the request origin if CLIENT_ORIGIN is not configured.
  const clientOrigin = (process.env.CLIENT_ORIGIN || `${req.protocol}://${req.get('host')}`).replace(
    /\/$/,
    '',
  );
  const resetURL = `${clientOrigin}/reset-password?token=${resetToken}`;

  const message = `Forgot your password? Open the link below to choose a new one:\n\n${resetURL}\n\nThis link is valid for 10 minutes.\nIf you didn't request a password reset, please ignore this email — your password will stay the same.`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message,
    });

    res.status(200).json({ status: 'success', message: 'Token sent to email!' });
  } catch (err) {
    // ROLLBACK — the email failed, so the token must not remain usable.
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    console.error('📧 Email sending failed:', err.message);
    return next(
      new AppError('There was an error sending the email. Try again later!', 500),
    );
  }
});

/**
 * RESET PASSWORD — the user PATCHes { password, passwordConfirm } to
 * /resetPassword/:token. We hash the incoming plain token and look up THAT, so
 * a leaked DB contains no usable tokens. The expiry check is folded into the
 * query. We use `.save()` (never findByIdAndUpdate) so hashing and validation
 * hooks run, then log the user in.
 */
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});

/**
 * UPDATE PASSWORD (logged-in user). Requires the CURRENT password even though
 * they are logged in — a token alone (borrowed laptop, stolen cookie) should not
 * be enough to lock the true owner out. Guard that passwordCurrent is present,
 * use `.save()` so hooks run, and issue a fresh token at the end (the
 * passwordChangedAt hook just invalidated the old one).
 */
exports.updatePassword = catchAsync(async (req, res, next) => {
  if (!req.body.passwordCurrent) {
    return next(new AppError('Please provide your current password', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  createSendToken(user, 200, res);
});
