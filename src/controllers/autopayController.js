const AutopayService = require('../services/autopay');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

exports.setupAutopay = async (req, res) => {
  try {
    const { userId, name, email, phone, amount, frequency } = req.body;

    if (!userId || !name || !email || !phone || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, name, email, phone, amount',
      });
    }

    const result = await AutopayService.setupAutopay({
      userId,
      name,
      email,
      phone,
      amount: parseFloat(amount),
      frequency: frequency || 'monthly',
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        subscription: result.subscription,
        tokenizationUrl: result.tokenizationUrl,
        // Don't send sensitive data
      },
    });
  } catch (error) {
    console.error('Setup autopay error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.completeTokenization = async (req, res) => {
  try {
    const { userId, fampayUserToken, fampayCardToken, regPayNum } = req.body;

    const result = await AutopayService.completeTokenization({
      userId,
      fampayUserToken,
      fampayCardToken,
      regPayNum,
    });

    res.json({
      success: true,
      data: {
        user: result.user,
        subscription: result.subscription,
      },
    });
  } catch (error) {
    console.error('Complete tokenization error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId required',
      });
    }

    const result = await AutopayService.getStatus(userId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.cancelAutopay = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId required',
      });
    }

    const result = await AutopayService.cancelAutopay(userId);

    res.json({
      success: true,
      data: {
        subscription: result,
        message: 'Autopay cancelled successfully',
      },
    });
  } catch (error) {
    console.error('Cancel autopay error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit } = req.query;

    const transactions = await AutopayService.getHistory(
      userId,
      parseInt(limit) || 10
    );

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.processChargeNow = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: 'subscriptionId required',
      });
    }

    const result = await AutopayService.processRecurringCharge(subscriptionId);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Process charge error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
