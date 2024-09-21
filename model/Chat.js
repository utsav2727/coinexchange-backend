const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['buyer', 'seller']
  },
  from: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users',
    required: true
  },
  to: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users'
  },
  message: {
    type: String
  },
  attachment: {
    type: String
  },
  tradeId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Trade',
  },
  tradeLineItem:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'TradeLineItems',
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

chatSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
  });

chatSchema.index({ from: 1 });
chatSchema.index({ to: 1 });
chatSchema.index({ tradeId: 1 });
chatSchema.index({ tradeLineItem: 1 });
chatSchema.index({ createdAt: -1 }); // Sort by newest first

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;
