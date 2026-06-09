const mongoose = require('mongoose');

const affiliateCommissionSchema = new mongoose.Schema({
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
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
  },
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Referral',
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  rate: {
    type: Number,
    required: [true, 'Commission rate is required'],
  },
  orderAmount: {
    type: Number,
    required: [true, 'Order amount is required'],
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    default: 'RWF',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending',
  },
  paidAt: Date,
  paidTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletTransaction',
  },
  notes: String,
}, {
  timestamps: true,
});

affiliateCommissionSchema.index({ tenantId: 1, affiliateId: 1, status: 1 });
affiliateCommissionSchema.index({ tenantId: 1, orderId: 1 });
affiliateCommissionSchema.index({ status: 1 });

module.exports = mongoose.model('AffiliateCommission', affiliateCommissionSchema);
