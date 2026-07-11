javascript
const express = require('express');
const router = express.Router();
const WebhookController = require('../controllers/webhookController');

// Webhook receiver for Fampay callbacks
router.post('/', WebhookController.handleWebhook);

// Health check for webhook
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'fampay-webhook' });
});

module.exports = router;
