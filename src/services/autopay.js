const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Transaction = require('../models/Transaction');
const FampayService = require('./fampay');
const { generateToken } = require('../utils/crypto');

class AutopayService {
  /**
   * Setup autopay for a user
   */
  async setupAutopay({
    userId,
    name,
    email,
    phone,
    amount,
    frequency = 'monthly',
  }) {
    // Check if user exists
    let user = await User.findOne({ userId });

    if (user) {
      // Update user details
      user.name = name;
      user.email = email;
      user.phone = phone;
      await user.save();
    } else {
      // Create new user
      user = new User({
        userId,
        name,
        email,
        phone,
      });
      await user.save();
    }

    // Check if subscription exists
    let subscription = await Subscription.findOne({ userId, status: 'active' });

    if (subscription) {
      throw new Error('User already has an active subscription');
    }

    // Initiate tokenization with Fampay
    const tokenResponse = await FampayService.createToken({
      name,
      email,
      phone,
    });

    // Store tokenization reference
    // tokenResponse will contain payment URL or token info

    // Create subscription record
    const nextChargeDate = this.calculateNextChargeDate(frequency);

    subscription = new Subscription({
      userId: user.userId,
      amount,
      frequency,
      nextChargeDate,
      status: 'pending_tokenization',
      fampayRegPayNum: tokenResponse.regPayNum || null,
    });

    await subscription.save();

    return {
      user,
      subscription,
      tokenizationUrl: tokenResponse.payUrl || tokenResponse.redirect_url,
      tokenizationData: tokenResponse,
    };
  }

  /**
   * Complete tokenization (webhook callback)
   */
  async completeTokenization({ userId, fampayUserToken, fampayCardToken, regPayNum }) {
    const user = await User.findOne({ userId });
    if (!user) {
      throw new Error('User not found');
    }

    user.fampayToken = generateToken();
    user.fampayUserToken = fampayUserToken;
    user.fampayCardToken = fampayCardToken;
    await user.save();

    // Activate subscription
    const subscription = await Subscription.findOne({
      userId: user.userId,
      status: 'pending_tokenization',
      fampayRegPayNum: regPayNum,
    });

    if (subscription) {
      subscription.status = 'active';
      await subscription.save();
    }

    return { user, subscription };
  }

  /**
   * Process recurring charge
   */
  async processRecurringCharge(subscriptionId) {
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      status: 'active',
    });

    if (!subscription) {
      throw new Error('Subscription not found or not active');
    }

    const user = await User.findOne({ userId: subscription.userId });
    if (!user || !user.fampayUserToken || !user.fampayCardToken) {
      throw new Error('User tokens not found');
    }

    // Create transaction record
    const transaction = new Transaction({
      subscriptionId: subscription._id,
      userId: user.userId,
      amount: subscription.amount,
      status: 'pending',
    });
    await transaction.save();

    try {
      // Charge through Fampay
      const chargeResponse = await FampayService.createRecurringCharge({
        userToken: user.fampayUserToken,
        cardToken: user.fampayCardToken,
        amount: subscription.amount,
        orderId: `AUTO_${subscription._id}_${Date.now()}`,
        description: `Autopay subscription - ${subscription.frequency}`,
      });

      // Update transaction
      transaction.fampayPayNum = chargeResponse.payNum || chargeResponse.transaction_id;
      transaction.fampayUTR = chargeResponse.utr || null;

      if (chargeResponse.status === 'success') {
        transaction.status = 'success';

        // Update subscription
        subscription.lastChargeDate = new Date();
        subscription.chargeCount += 1;
        subscription.totalCharged += subscription.amount;
        subscription.nextChargeDate = this.calculateNextChargeDate(
          subscription.frequency
        );

        await subscription.save();
      } else {
        transaction.status = 'failed';
        transaction.responseData = chargeResponse;
      }

      await transaction.save();

      return {
        transaction,
        subscription,
        chargeResponse,
      };
    } catch (error) {
      transaction.status = 'failed';
      transaction.responseData = { error: error.message };
      await transaction.save();

      // Mark subscription as failed after multiple retries
      if (subscription.chargeCount >= 3) {
        subscription.status = 'failed';
        await subscription.save();
      }

      throw error;
    }
  }

  /**
   * Cancel autopay
   */
  async cancelAutopay(userId) {
    const subscription = await Subscription.findOne({
      userId,
      status: 'active',
    });

    if (!subscription) {
      throw new Error('No active subscription found');
    }

    const user = await User.findOne({ userId });
    if (user && user.fampayUserToken && user.fampayCardToken) {
      try {
        await FampayService.cancelRecurring({
          userToken: user.fampayUserToken,
          cardToken: user.fampayCardToken,
        });
      } catch (error) {
        console.error('Fampay cancellation failed:', error.message);
        // Continue with local cancellation
      }
    }

    subscription.status = 'cancelled';
    await subscription.save();

    // Optionally clear user tokens
    // user.fampayCardToken = null;
    // await user.save();

    return subscription;
  }

  /**
   * Get user subscription status
   */
  async getStatus(userId) {
    const user = await User.findOne({ userId });
    const subscription = await Subscription.findOne({ userId });

    return {
      user,
      subscription,
      hasActiveSubscription: subscription?.status === 'active',
      nextChargeDate: subscription?.nextChargeDate,
    };
  }

  /**
   * Get transaction history
   */
  async getHistory(userId, limit = 10) {
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);

    return transactions;
  }

  /**
   * Calculate next charge date based on frequency
   */
  calculateNextChargeDate(frequency, fromDate = new Date()) {
    const date = new Date(fromDate);

    switch (frequency) {
      case 'daily':
        date.setDate(date.getDate() + 1);
        break;
      case 'weekly':
        date.setDate(date.getDate() + 7);
        break;
      case 'monthly':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'quarterly':
        date.setMonth(date.getMonth() + 3);
        break;
      default:
        date.setMonth(date.getMonth() + 1);
    }

    return date;
  }
}

module.exports = new AutopayService();
