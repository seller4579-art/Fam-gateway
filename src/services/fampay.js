const axios = require('axios');
const config = require('../config');
const { generateSignature } = require('../utils/crypto');

class FampayService {
  constructor() {
    this.baseUrl = config.fampay.baseUrl;
    this.merchantId = config.fampay.merchantId;
    this.txnPassword = config.fampay.txnPassword;
    this.apiKey = config.fampay.apiKey;
  }

  /**
   * Create a token for a user (card tokenization for autopay)
   */
  async createToken(userData) {
    const params = {
      merchant_id: this.merchantId,
      customer_name: userData.name,
      customer_email: userData.email,
      customer_phone: userData.phone,
      // Fampay specific fields - adjust based on actual API docs
      return_url: `${config.webhook.baseUrl}/api/autopay/token-callback`,
    };

    const signature = generateSignature(params, this.txnPassword);

    const payload = {
      ...params,
      signature,
      api_key: this.apiKey,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/tokenize`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Fampay token creation failed:', error.response?.data || error.message);
      throw new Error(`Token creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Create a recurring/autopay charge using token
   */
  async createRecurringCharge({
    userToken,
    cardToken,
    amount,
    orderId,
    description,
  }) {
    const params = {
      merchant_id: this.merchantId,
      user_token: userToken,
      card_token: cardToken,
      amount: Math.round(amount * 100), // Convert to paise/cents
      order_id: orderId,
      description: description || 'Autopay subscription charge',
      recurring: 'true',
    };

    const signature = generateSignature(params, this.txnPassword);

    const payload = {
      ...params,
      signature,
      api_key: this.apiKey,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/charge`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Fampay charge failed:', error.response?.data || error.message);
      throw new Error(`Charge failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Verify UTR or transaction status
   */
  async verifyTransaction(transactionId) {
    const params = {
      merchant_id: this.merchantId,
      transaction_id: transactionId,
    };

    const signature = generateSignature(params, this.txnPassword);

    const payload = {
      ...params,
      signature,
      api_key: this.apiKey,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/verify`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Fampay verification failed:', error.response?.data || error.message);
      throw new Error(`Verification failed: ${error.response?.data?.message || error.message}`);
    }
  }

  /**
   * Cancel a recurring subscription
   */
  async cancelRecurring({ userToken, cardToken }) {
    const params = {
      merchant_id: this.merchantId,
      user_token: userToken,
      card_token: cardToken,
      action: 'cancel',
    };

    const signature = generateSignature(params, this.txnPassword);

    const payload = {
      ...params,
      signature,
      api_key: this.apiKey,
    };

    try {
      const response = await axios.post(`${this.baseUrl}/recurring/cancel`, payload, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('Fampay cancellation failed:', error.response?.data || error.message);
      throw new Error(`Cancellation failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

module.exports = new FampayService();
