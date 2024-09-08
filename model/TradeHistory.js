const mongoose = require("mongoose");

const TradeHistorySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["buy", "sell"],
    required: true,
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  sourceAmount: {
    type: Number,
    required: true,
  },
  targetAmount: {
    type: Number,
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
    default:0
  },
  paymentAddress: {
    type: String,
  },
  paymentWindow: {
    type: Number, 
  },
  chatId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Chat"
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

TradeHistorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Trade", TradeHistorySchema);
