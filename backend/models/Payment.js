const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: 0,
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    required: true,
  },
  method: {
    type: String,
    enum: ['mtn_money', 'airtel_money', 'stripe', 'paypal', 'cod', 'wallet'],
    required: [true, 'Payment method is required'],
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true,
  },
  providerReference: String,
  providerData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  intentId: String,
  sessionId: String,
  gatewayResponse: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
  },
  fee: {
    type: Number,
    default: 0,
  },
  netAmount: {
    type: Number,
    default: function() { return this.amount - this.fee; },
  },
  refunds: [{
    amount: { type: Number, required: true },
    reason: String,
    status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
    transactionId: String,
    processedAt: { type: Date, default: Date.now },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  refundedAmount: {
    type: Number,
    default: 0,
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  paidAt: Date,
  failedAt: Date,
  failureReason: String,
  webhookReceivedAt: Date,
  webhookData: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true,
});

paymentSchema.index({ tenantId: 1, orderId: 1 });
paymentSchema.index({ tenantId: 1, userId: 1 });
paymentSchema.index({ status: 1, createdAt: 1 });
paymentSchema.index({ method: 1, status: 1 });
paymentSchema.index({ intentId: 1 });
paymentSchema.index({ sessionId: 1 });

paymentSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'paid' && !this.paidAt) {
    this.paidAt = new Date();
  }
  if (this.isModified('status') && this.status === 'failed' && !this.failedAt) {
    this.failedAt = new Date();
  }
  this.netAmount = this.amount - this.fee;
  next();
});

paymentSchema.methods.refund = async function(amount, reason, userId) {
  if (this.status !== 'paid') throw new Error('Payment must be in paid status to refund');
  const refundAmount = amount || this.amount - this.refundedAmount;
  if (refundAmount > this.amount - this.refundedAmount) {
    throw new Error('Refund amount exceeds remaining balance');
  }
  this.refunds.push({
    amount: refundAmount,
    reason,
    status: 'completed',
    processedAt: new Date(),
    processedBy: userId,
  });
  this.refundedAmount += refundAmount;
  if (this.refundedAmount >= this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }
  return this.save();
};

module.exports = mongoose.model('Payment', paymentSchema);
