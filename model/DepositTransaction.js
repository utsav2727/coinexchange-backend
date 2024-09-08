const mongoose = require("mongoose");

const DepositTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
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
    default:0
  },
  afterCharge: {
    type: Number,
    required: true,
    default:0
  },
  transactionMode: {
    type: String
  },
  walletAddress: {
    type: String,
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

module.exports = mongoose.model("DepositTransaction", DepositTransactionSchema);
