const mongoose = require('mongoose');

const configSchema = new mongoose.Schema({
  buylimit: {
    type: Number,
    default:10000
  },
  sellLimit: {
    type: Number,
    default:10000
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

configSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
  });


const Chat = mongoose.model('Config', configSchema);

module.exports = Chat;
