const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const supportSchema = new Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users',
        required: true
      },
  email: {
    type: String,
    required: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
  },
  message: {
    type: String,
    required: true,
  },
  documentFile: {
    type: String, // File path or URL
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

supportSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
  });

const Support = mongoose.model('Support', supportSchema);
module.exports = Support;
