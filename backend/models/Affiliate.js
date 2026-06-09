const mongoose = require('mongoose');

const affiliateSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
  },
  referralCode: {
    type: String,
    required: [true, 'Referral code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'pending',
  },
  commissionRate: {
    type: Number,
    default: 5,
    min: 0,
    max: 50,
  },
  totalEarnings: {
    type: Number,
    default: 0,
  },
  totalWithdrawn: {
    type: Number,
    default: 0,
  },
  currentBalance: {
    type: Number,
    default: 0,
  },
  lifetimeSales: {
    type: Number,
    default: 0,
  },
  referralCount: {
    type: Number,
    default: 0,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  conversionCount: {
    type: Number,
    default: 0,
  },
  conversionRate: {
    type: Number,
    default: 0,
  },
  paymentMethod: {
    type: String,
    enum: ['mobile_money', 'bank', 'paypal', 'wallet'],
  },
  paymentDetails: {
    mobileMoney: { provider: String, phoneNumber: String },
    bank: { bankName: String, accountNumber: String, accountName: String },
    paypal: { email: String },
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

affiliateSchema.index({ tenantId: 1, referralCode: 1 }, { unique: true });
affiliateSchema.index({ tenantId: 1, status: 1 });

affiliateSchema.pre('validate', function(next) {
  if (!this.referralCode) {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.referralCode = `ISOKO-${random}`;
  }
  next();
});

module.exports = mongoose.model('Affiliate', affiliateSchema);
