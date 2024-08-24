const mongoose = require("mongoose");

const WithdrawTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  currencyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Currency",
    required: true,
  },
  transactionRef: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StatusRef",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  charge: {
    type: Number,
    required: true,
  },
  afterCharge: {
    type: Number,
    required: true,
  },
  transactionMode: {
    type: String,
    required: true,
  },
  walletAddress: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("WithdrawTransaction", WithdrawTransactionSchema);
