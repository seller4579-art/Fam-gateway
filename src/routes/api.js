const express = require('express');
const router = express.Router();
const AutopayController = require('../controllers/autopayController');

// Setup autopay
router.post('/autopay/setup', AutopayController.setupAutopay);

// Complete tokenization (callback)
router.post('/autopay/token-callback', AutopayController.completeTokenization);

// Get subscription status
router.get('/autopay/status/:userId', AutopayController.getStatus);

// Cancel autopay
router.post('/autopay/cancel', AutopayController.cancelAutopay);

// Get transaction history
router.get('/autopay/history/:userId', AutopayController.getHistory);

// Manually process a charge (for testing)
router.post('/autopay/charge', AutopayController.processChargeNow);

module.exports = router;
