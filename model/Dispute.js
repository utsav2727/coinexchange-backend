const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Users',
    required: true
  },
  status: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'StatusRef',
    required: true
  },
  priority: {
    type: String
  },
  subject: {
    type: String
  },
  tradeId: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Trade',
    required: true
  },
  chatId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Chat'
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

disputeSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
  });

const Chat = mongoose.model('Dispute', disputeSchema);

module.exports = Chat;
