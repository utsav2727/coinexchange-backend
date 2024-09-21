const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const kycSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  },
  documentType: {
    type: String,
    enum: ['aadhar', 'identityCertificate', 'drivingLicense'],
    required: true
  },
  documentNumber: {
    type: String,
    required: true,
  },
  documentFile: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

kycSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
  });

const Kyc = mongoose.model('Kyc', kycSchema);
module.exports = Kyc;
