const mongoose = require("mongoose");

const TradeSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["buy", "sell"],
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  sourceAmount: {
    type: Number,
    required: true,
  },
  targetAmount: {
    type: Number,
    required: true,
  },
  exchangeRate: {
    type: Number,
    required: true,
  },
  status: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StatusRef",
    required: true,
  },
  charges: {
    type: Number,
    required: true,
  },
  paymentAddress: {
    type: String,
    required: true,
  },
  paymentWindow: {
    type: Number, // Time window in minutes or another time unit
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

module.exports = mongoose.model("Trade", TradeSchema);
