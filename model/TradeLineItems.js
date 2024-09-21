const mongoose = require("mongoose");

// 3 status - Inprogress, Cancelled, Closed

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
  status:{
    type:String,
    default:"InProgress"
  }
});

TradeLineItemsSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

TradeLineItemsSchema.index({ buyer: 1 });
TradeLineItemsSchema.index({ seller: 1 });
TradeLineItemsSchema.index({ tradeId: 1 });
TradeLineItemsSchema.index({ status: 1 });
TradeLineItemsSchema.index({ createdAt: -1 }); // Descending order
TradeLineItemsSchema.index({ updatedAt: -1 }); // Descending order

module.exports = mongoose.model("TradeLineItems", TradeLineItemsSchema);
