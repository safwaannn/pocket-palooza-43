/**
 * ============================================================================
 * ADMIN ROUTES — mounted at /api/v1/admin
 * ============================================================================
 * Every route requires a login (protect). `/me/roles` is available to any
 * logged-in user — it only reports the caller's own role, which the front-end
 * RBAC hook needs. Everything else is gated behind restrictTo('admin').
 *
 * Note the ORDER: the `/me/roles` route and the admin gate are arranged so the
 * self-serve roles endpoint is reachable before the admin-only wall.
 */
const express = require('express');
const adminController = require('./../controllers/adminController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Gate 1: a login is required for everything here.
router.use(authController.protect);

// Any authenticated user may read THEIR OWN roles.
router.get('/me/roles', adminController.getMyRoles);

// Gate 2: everything below is admin-only.
router.use(authController.restrictTo('admin'));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/role', adminController.setUserRole);

module.exports = router;
