/**
 * ============================================================================
 * USER ROUTES  — mounted at /api/v1/users
 * ============================================================================
 *
 * `router.use(middleware)` with no path applies to every route BELOW it. The
 * file reads top-to-bottom as security zones:
 *
 *   ZONE 1 — PUBLIC:  signup, login, logout, forgot/resetPassword
 *   router.use(protect)  ← gate
 *   ZONE 2 — ANY LOGGED-IN USER:  me, updateMe, deleteMe, updatePassword
 *
 * Admin-only user management lives in adminRoutes.js, not here. Making the safe
 * thing the default (everything after the gate needs a login) means you cannot
 * publish an unprotected endpoint by forgetting to paste `protect`.
 */
const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

const router = express.Router();

/* ══════════════════════════ ZONE 1 — PUBLIC ══════════════════════════════ */
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

/* ═══════════════════ GATE: everything below needs a login ═════════════════ */
router.use(authController.protect);

/* ═════════════════ ZONE 2 — ANY AUTHENTICATED USER ═══════════════════════ */
router.patch('/updatePassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

module.exports = router;
