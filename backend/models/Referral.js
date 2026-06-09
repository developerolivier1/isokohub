const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
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
  referredUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Referred user ID is required'],
  },
  referralCode: {
    type: String,
    required: [true, 'Referral code is required'],
  },
  source: {
    type: String,
    enum: ['direct_link', 'social', 'email', 'sms', 'banner'],
    default: 'direct_link',
  },
  status: {
    type: String,
    enum: ['clicked', 'registered', 'first_purchase', 'converted', 'expired'],
    default: 'clicked',
  },
  commissionEarned: {
    type: Number,
    default: 0,
  },
  firstPurchaseAmount: Number,
  firstPurchaseAt: Date,
  convertedAt: Date,
  ipAddress: String,
  userAgent: String,
}, {
  timestamps: true,
});

referralSchema.index({ tenantId: 1, affiliateId: 1 });
referralSchema.index({ tenantId: 1, referredUserId: 1 });
referralSchema.index({ referralCode: 1 });

module.exports = mongoose.model('Referral', referralSchema);
