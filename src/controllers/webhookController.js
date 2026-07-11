const { verifyWebhookSignature } = require('../utils/crypto');
const AutopayService = require('../services/autopay');
const config = require('../config');

exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'] || req.headers['x-signature'];

    // Verify signature if provided
    if (signature) {
      const isValid = verifyWebhookSignature(
        req.body,
        signature,
        config.webhook.secret
      );
      if (!isValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid webhook signature',
        });
      }
    }

    const { event, data } = req.body;

    // Log webhook event
    console.log(`Webhook event: ${event}`, data);

    switch (event) {
      case 'tokenization.success':
        await handleTokenizationSuccess(data);
        break;

      case 'charge.success':
        await handleChargeSuccess(data);
        break;

      case 'charge.failed':
        await handleChargeFailed(data);
        break;

      case 'recurring.cancelled':
        await handleRecurringCancelled(data);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    res.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    // Always return 200 for webhooks to prevent retries
    res.status(200).json({ success: false, error: error.message });
  }
};

async function handleTokenizationSuccess(data) {
  const { userId, fampayUserToken, fampayCardToken, regPayNum } = data;

  await AutopayService.completeTokenization({
    userId,
    fampayUserToken,
    fampayCardToken,
    regPayNum,
  });
}

async function handleChargeSuccess(data) {
  // Update transaction status
  // Implementation depends on Fampay webhook payload structure
  console.log('Charge success:', data);
}

async function handleChargeFailed(data) {
  console.log('Charge failed:', data);
  // Handle failure - maybe retry or notify user
}

async function handleRecurringCancelled(data) {
  console.log('Recurring cancelled:', data);
}
