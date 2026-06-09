const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
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
  returnNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: mongoose.Schema.Types.ObjectId,
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, required: true },
    condition: { type: String, enum: ['new', 'used', 'damaged', 'defective'], default: 'new' },
  }],
  reason: {
    type: String,
    required: [true, 'Return reason is required'],
  },
  type: {
    type: String,
    enum: ['refund', 'exchange', 'store_credit'],
    default: 'refund',
  },
  status: {
    type: String,
    enum: ['requested', 'approved', 'picked_up', 'received', 'inspected', 'completed', 'rejected'],
    default: 'requested',
  },
  images: [String],
  pickupAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  pickupScheduledAt: Date,
  pickupCompletedAt: Date,
  receivedAt: Date,
  inspectionNotes: String,
  inspectionImages: [String],
  resolution: {
    refundAmount: Number,
    exchangeProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    storeCreditAmount: Number,
    notes: String,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectionReason: String,
}, {
  timestamps: true,
});

returnSchema.index({ tenantId: 1, orderId: 1 });
returnSchema.index({ status: 1 });
returnSchema.index({ userId: 1 });

returnSchema.pre('validate', function(next) {
  if (!this.returnNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.returnNumber = `RTN-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Return', returnSchema);
