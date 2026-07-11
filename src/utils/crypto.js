const crypto = require('crypto');

/**
 * Generate SHA1 signature for Fampay API requests
 */
function generateSignature(params, password) {
  // Sort keys alphabetically
  const sortedKeys = Object.keys(params).sort();
  let stringToSign = '';

  for (const key of sortedKeys) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      stringToSign += `${key}=${params[key]}&`;
    }
  }

  stringToSign += `txn_password=${password}`;

  return crypto.createHash('sha1').update(stringToSign).digest('hex').toUpperCase();
}

/**
 * Generate random token
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

module.exports = {
  generateSignature,
  generateToken,
  verifyWebhookSignature,
};
