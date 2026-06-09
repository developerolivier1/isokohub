const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
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
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
    required: [true, 'Payment ID is required'],
  },
  refundNumber: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: [true, 'Refund amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Refund reason is required'],
  },
  type: {
    type: String,
    enum: ['full', 'partial'],
    required: [true, 'Refund type is required'],
  },
  method: {
    type: String,
    enum: ['original', 'wallet', 'bank_transfer'],
    default: 'original',
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: Number,
    amount: Number,
  }],
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

refundSchema.index({ tenantId: 1, orderId: 1 });
refundSchema.index({ status: 1 });
refundSchema.index({ tenantId: 1, createdAt: -1 });

refundSchema.pre('validate', function(next) {
  if (!this.refundNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.refundNumber = `RFD-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Refund', refundSchema);
