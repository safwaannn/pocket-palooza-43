/**
 * ============================================================================
 * CATEGORY ROUTES — mounted at /api/v1/categories
 * ============================================================================
 * Every route requires a login (categories are per-user). `restrictTo` blocks
 * viewers from writing: reading is allowed for all authenticated roles, but
 * create/update/delete need at least 'user'.
 */
const express = require('express');
const categoryController = require('./../controllers/categoryController');
const authController = require('./../controllers/authController');

const router = express.Router();

// Secure by default — a login is required for everything below.
router.use(authController.protect);

router
  .route('/')
  .get(categoryController.getAllCategories)
  .post(
    authController.restrictTo('user', 'manager', 'admin'),
    categoryController.createCategory,
  );

router
  .route('/:id')
  .patch(
    authController.restrictTo('user', 'manager', 'admin'),
    categoryController.updateCategory,
  )
  .delete(
    authController.restrictTo('user', 'manager', 'admin'),
    categoryController.deleteCategory,
  );

module.exports = router;
