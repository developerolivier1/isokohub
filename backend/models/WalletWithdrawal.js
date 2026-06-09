const mongoose = require('mongoose');

const walletWithdrawalSchema = new mongoose.Schema({
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
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [100, 'Minimum withdrawal is 100'],
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
    required: true,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
  },
  method: {
    type: String,
    enum: ['mobile_money', 'bank_transfer', 'paypal', 'stripe'],
    required: [true, 'Withdrawal method is required'],
  },
  accountDetails: {
    mobileMoney: {
      provider: { type: String, enum: ['mtn', 'airtel'] },
      phoneNumber: String,
      name: String,
    },
    bank: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      branchCode: String,
      swiftCode: String,
    },
    paypal: {
      email: String,
    },
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'cancelled'],
    default: 'pending',
  },
  reference: {
    type: String,
    unique: true,
  },
  providerReference: String,
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: Date,
  failureReason: String,
  notes: String,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
}, {
  timestamps: true,
});

walletWithdrawalSchema.index({ walletId: 1, createdAt: -1 });
walletWithdrawalSchema.index({ userId: 1 });
walletWithdrawalSchema.index({ tenantId: 1, status: 1 });
walletWithdrawalSchema.index({ status: 1 });

walletWithdrawalSchema.pre('validate', function(next) {
  if (!this.reference) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.reference = `WD-${timestamp}-${random}`;
  }
  if (this.netAmount === undefined) {
    this.netAmount = this.amount - (this.fee || 0);
  }
  next();
});

module.exports = mongoose.model('WalletWithdrawal', walletWithdrawalSchema);
