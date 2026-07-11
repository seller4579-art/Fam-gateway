const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    phone: {
      type: String,
      required: true,
    },
    fampayToken: {
      type: String,
      default: null,
    },
    fampayCardToken: {
      type: String,
      default: null,
    },
    fampayUserToken: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
