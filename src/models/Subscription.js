const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      default: 'monthly',
    },
    nextChargeDate: {
      type: Date,
      required: true,
    },
    lastChargeDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled', 'failed'],
      default: 'active',
    },
    fampayRegPayNum: {
      type: String,
      default: null,
    },
    totalCharged: {
      type: Number,
      default: 0,
    },
    chargeCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subscription', SubscriptionSchema);
