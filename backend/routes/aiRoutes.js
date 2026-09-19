/**
 * ============================================================================
 * AI ROUTES — mounted at /api/v1/ai
 * ============================================================================
 *
 * Every route here requires a login, since answers are built from the
 * calling user's own transactions/budgets/categories.
 */
const express = require('express');
const aiController = require('./../controllers/aiController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

router.post('/ask', aiController.ask);

module.exports = router;
