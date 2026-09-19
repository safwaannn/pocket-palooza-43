/**
 * ============================================================================
 * RECURRING TRANSACTION ROUTES — mounted at /api/v1/recurring-transactions
 * ============================================================================
 * All routes require a login. `/materialize` is a literal path above `/:id`.
 * Writes (including materialize, which inserts transactions) require the 'user'
 * role or higher.
 */
const express = require('express');
const recurringController = require('./../controllers/recurringController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

const canWrite = authController.restrictTo('user', 'manager', 'admin');

router.post('/materialize', canWrite, recurringController.materialize);

router
  .route('/')
  .get(recurringController.getAllRecurring)
  .post(canWrite, recurringController.createRecurring);

router
  .route('/:id')
  .get(recurringController.getRecurring)
  .patch(canWrite, recurringController.updateRecurring)
  .delete(canWrite, recurringController.deleteRecurring);

module.exports = router;
