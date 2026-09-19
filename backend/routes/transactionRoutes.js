/**
 * ============================================================================
 * TRANSACTION ROUTES — mounted at /api/v1/transactions
 * ============================================================================
 * All routes require a login. Aggregation routes (/spending, /summary) are
 * LITERAL paths and MUST be declared above `/:id`, or `/:id` would swallow
 * "spending" as an id and try to cast it to an ObjectId.
 * Writes require at least the 'user' role (viewers are read-only).
 */
const express = require('express');
const transactionController = require('./../controllers/transactionController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

// --- Literal/aggregation routes FIRST -----------------------------------
router.get('/spending', transactionController.getMonthlySpending);
router.get('/summary', transactionController.getSummary);

// --- CRUD ---------------------------------------------------------------
const canWrite = authController.restrictTo('user', 'manager', 'admin');

router
  .route('/')
  .get(transactionController.getAllTransactions)
  .post(canWrite, transactionController.createTransaction);

router
  .route('/:id')
  .get(transactionController.getTransaction)
  .patch(canWrite, transactionController.updateTransaction)
  .delete(canWrite, transactionController.deleteTransaction);

module.exports = router;
