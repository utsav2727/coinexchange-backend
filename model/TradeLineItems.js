const mongoose = require("mongoose");

const TradeLineItemsSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
  },
  tradeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Trade",
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

TradeLineItemsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("TradeLineItems", TradeLineItemsSchema);
