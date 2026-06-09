const mongoose = require('mongoose');

const affiliateWithdrawalSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  affiliateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Affiliate',
    required: [true, 'Affiliate ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1000, 'Minimum withdrawal is 1000'],
  },
  fee: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    default: 'RWF',
  },
  method: {
    type: String,
    enum: ['mobile_money', 'bank', 'paypal', 'wallet'],
    required: [true, 'Withdrawal method is required'],
  },
  accountDetails: {
    mobileMoney: { provider: String, phoneNumber: String },
    bank: { bankName: String, accountNumber: String, accountName: String, branchCode: String },
    paypal: { email: String },
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  reference: {
    type: String,
    unique: true,
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: Date,
  failureReason: String,
  notes: String,
}, {
  timestamps: true,
});

affiliateWithdrawalSchema.index({ tenantId: 1, affiliateId: 1, status: 1 });

affiliateWithdrawalSchema.pre('validate', function(next) {
  if (!this.reference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.reference = `AFW-${timestamp}-${random}`;
  }
  if (this.netAmount === undefined) {
    this.netAmount = this.amount - (this.fee || 0);
  }
  next();
});

module.exports = mongoose.model('AffiliateWithdrawal', affiliateWithdrawalSchema);
