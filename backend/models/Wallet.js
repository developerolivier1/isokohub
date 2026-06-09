const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
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
  balance: {
    type: Number,
    default: 0,
    min: [0, 'Balance cannot be negative'],
  },
  escrowBalance: {
    type: Number,
    default: 0,
    min: [0, 'Escrow balance cannot be negative'],
  },
  currency: {
    type: String,
    default: process.env.DEFAULT_CURRENCY || 'RWF',
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
  },
  status: {
    type: String,
    enum: ['active', 'frozen', 'suspended', 'closed'],
    default: 'active',
  },
  pinHash: {
    type: String,
    select: false,
  },
  dailyLimit: {
    type: Number,
    default: 1000000,
  },
  monthlyLimit: {
    type: Number,
    default: 10000000,
  },
  dailyUsed: {
    type: Number,
    default: 0,
  },
  monthlyUsed: {
    type: Number,
    default: 0,
  },
  lastDailyReset: Date,
  lastMonthlyReset: Date,
  isFrozen: {
    type: Boolean,
    default: false,
  },
  freezeReason: String,
}, {
  timestamps: true,
});

walletSchema.index({ userId: 1 }, { unique: true });
walletSchema.index({ tenantId: 1 });
walletSchema.index({ status: 1 });

walletSchema.pre('save', function(next) {
  const now = new Date();
  if (!this.lastDailyReset || now.getDate() !== this.lastDailyReset.getDate()) {
    this.dailyUsed = 0;
    this.lastDailyReset = now;
  }
  if (!this.lastMonthlyReset || now.getMonth() !== this.lastMonthlyReset.getMonth()) {
    this.monthlyUsed = 0;
    this.lastMonthlyReset = now;
  }
  next();
});

walletSchema.methods.canWithdraw = function(amount) {
  if (this.status !== 'active') return { allowed: false, reason: 'Wallet is not active' };
  if (this.isFrozen) return { allowed: false, reason: 'Wallet is frozen' };
  if (this.balance < amount) return { allowed: false, reason: 'Insufficient balance' };
  if (this.dailyUsed + amount > this.dailyLimit) return { allowed: false, reason: 'Daily limit exceeded' };
  if (this.monthlyUsed + amount > this.monthlyLimit) return { allowed: false, reason: 'Monthly limit exceeded' };
  return { allowed: true };
};

walletSchema.methods.debit = function(amount, description) {
  if (this.balance < amount) throw new Error('Insufficient balance');
  this.balance -= amount;
  return this.save();
};

walletSchema.methods.credit = function(amount, description) {
  this.balance += amount;
  return this.save();
};

module.exports = mongoose.model('Wallet', walletSchema);
