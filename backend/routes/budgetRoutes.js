/**
 * ============================================================================
 * BUDGET ROUTES — mounted at /api/v1/budgets
 * ============================================================================
 * All routes require a login. `/detect-alerts` is a literal path declared above
 * `/:id`. Writes require at least the 'user' role.
 */
const express = require('express');
const budgetController = require('./../controllers/budgetController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

const canWrite = authController.restrictTo('user', 'manager', 'admin');

// Literal route BEFORE /:id.
router.post('/detect-alerts', canWrite, budgetController.detectAlerts);

router
  .route('/')
  .get(budgetController.getAllBudgets)
  .post(canWrite, budgetController.createBudget);

router
  .route('/:id')
  .get(budgetController.getBudget)
  .delete(canWrite, budgetController.deleteBudget);

module.exports = router;
