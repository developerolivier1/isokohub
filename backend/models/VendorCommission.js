const mongoose = require('mongoose');

const vendorCommissionSchema = new mongoose.Schema({
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required'],
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
  },
  orderItemId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  commissionRate: {
    type: Number,
    required: [true, 'Commission rate is required'],
    min: 0,
    max: 100,
  },
  commissionAmount: {
    type: Number,
    required: [true, 'Commission amount is required'],
    min: 0,
  },
  netAmount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    default: 'RWF',
  },
  status: {
    type: String,
    enum: ['pending', 'calculated', 'paid', 'cancelled'],
    default: 'pending',
  },
  paidAt: Date,
  paidTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletTransaction',
  },
  period: {
    start: Date,
    end: Date,
  },
  notes: String,
}, {
  timestamps: true,
});

vendorCommissionSchema.index({ vendorId: 1, status: 1 });
vendorCommissionSchema.index({ tenantId: 1, status: 1 });
vendorCommissionSchema.index({ orderId: 1 });
vendorCommissionSchema.index({ status: 1, paidAt: 1 });

module.exports = mongoose.model('VendorCommission', vendorCommissionSchema);
