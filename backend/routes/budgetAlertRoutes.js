/**
 * ============================================================================
 * BUDGET ALERT ROUTES — mounted at /api/v1/budget-alerts
 * ============================================================================
 * All routes require a login. Literal routes (/unread-count, /acknowledge-all)
 * and the /:id/acknowledge sub-route are declared above the bare /:id delete.
 * Acknowledging changes state, so it needs at least the 'user' role.
 */
const express = require('express');
const budgetAlertController = require('./../controllers/budgetAlertController');
const authController = require('./../controllers/authController');

const router = express.Router();

router.use(authController.protect);

const canWrite = authController.restrictTo('user', 'manager', 'admin');

router.get('/unread-count', budgetAlertController.getUnreadCount);
router.post('/acknowledge-all', canWrite, budgetAlertController.acknowledgeAll);
router.patch('/:id/acknowledge', canWrite, budgetAlertController.acknowledgeOne);

router.get('/', budgetAlertController.getAllAlerts);
router.delete('/:id', canWrite, budgetAlertController.deleteAlert);

module.exports = router;
