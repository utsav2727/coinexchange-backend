const mongoose = require("mongoose");

const TradeSchema = new mongoose.Schema({
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
  prefferedpaymentType: {
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

TradeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

TradeSchema.index({ type: 1 });
TradeSchema.index({ buyer: 1 });
TradeSchema.index({ seller: 1 });
TradeSchema.index({ status: 1 });
TradeSchema.index({ createdAt: -1 }); // Sort by newest first

module.exports = mongoose.model("Trade", TradeSchema);
