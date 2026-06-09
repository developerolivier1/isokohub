const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: [true, 'Wallet ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  type: {
    type: String,
    enum: [
      'deposit', 'withdrawal', 'transfer_in', 'transfer_out',
      'payment', 'refund', 'commission', 'escrow_hold',
      'escrow_release', 'escrow_refund', 'adjustment',
    ],
    required: [true, 'Transaction type is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
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
    default: process.env.DEFAULT_CURRENCY || 'RWF',
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
  },
  balanceBefore: {
    type: Number,
    required: true,
  },
  balanceAfter: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  reference: {
    type: String,
    required: [true, 'Reference is required'],
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  relatedOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  relatedTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletTransaction',
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  failureReason: String,
}, {
  timestamps: true,
});

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ tenantId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });
walletTransactionSchema.index({ relatedOrderId: 1 });
walletTransactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

walletTransactionSchema.pre('validate', function(next) {
  if (!this.reference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.reference = `WLT-${timestamp}-${random}`;
  }
  if (this.netAmount === undefined) {
    this.netAmount = this.amount - (this.fee || 0);
  }
  next();
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);
