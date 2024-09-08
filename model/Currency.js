const mongoose = require("mongoose");

const CurrencySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  symbol: {
    type: String,
    required: true,
    unique: true,
  },
  tag: {
    type: String,
    required: true,
    unique: true,
  },
  conversionRate: {
    type: Number,
    required: true,
  },
  baseCurrency:{
    type: Number,
    required:true,
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

// Automatically update the `updatedAt` field before saving the document
CurrencySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Currency", CurrencySchema);
