require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  mongodbUri: process.env.MONGODB_URI,

  fampay: {
    baseUrl: process.env.FAMPAY_BASE_URL || 'https://api.fampay.in/v1',
    merchantId: process.env.FAMPAY_MERCHANT_ID,
    txnPassword: process.env.FAMPAY_TXN_PASSWORD,
    apiKey: process.env.FAMPAY_API_KEY,
  },

  webhook: {
    secret: process.env.WEBHOOK_SECRET || 'default_secret_change_me',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
  },

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
  },
};
