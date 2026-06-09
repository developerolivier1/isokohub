const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true,
  },
  name: { type: String, required: true },
  sku: String,
  image: String,
  variantId: mongoose.Schema.Types.ObjectId,
  variantName: String,
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  total: { type: Number, required: true },
  commissionRate: { type: Number, default: 0 },
  commissionAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'returned', 'cancelled'],
    default: 'pending',
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
  },
});

const orderSchema = new mongoose.Schema({
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
  orderNumber: {
    type: String,
    required: true,
    unique: true,
  },
  items: [orderItemSchema],
  shippingAddress: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: String,
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    zipCode: String,
    country: { type: String, default: 'RW' },
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    notes: String,
  },
  billingAddress: {
    fullName: String,
    phone: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  paymentMethod: {
    type: String,
    enum: ['mtn_money', 'airtel_money', 'stripe', 'paypal', 'cod'],
    required: [true, 'Payment method is required'],
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'returned', 'cancelled'],
    default: 'pending',
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingFee: {
    type: Number,
    default: 0,
  },
  tax: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    default: 'RWF',
  },
  coupon: {
    code: String,
    discount: Number,
    type: { type: String, enum: ['percentage', 'fixed'] },
  },
  deliveryPartnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
  },
  deliveryDriverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryDriver',
  },
  deliveryTracking: {
    estimatedDelivery: Date,
    actualDelivery: Date,
    otp: String,
    otpVerified: { type: Boolean, default: false },
    deliveryNotes: String,
    signature: String,
  },
  notes: String,
  internalNotes: String,
  statusHistory: [{
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: String,
  }],
  isArchived: {
    type: Boolean,
    default: false,
  },
  sessionId: String,
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

orderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
orderSchema.index({ tenantId: 1, status: 1 });
orderSchema.index({ tenantId: 1, 'items.vendorId': 1 });
orderSchema.index({ tenantId: 1, paymentStatus: 1 });
orderSchema.index({ tenantId: 1, deliveryDriverId: 1 });
orderSchema.index({ tenantId: 1, createdAt: -1 });

orderSchema.virtual('payment', {
  ref: 'Payment',
  localField: 'paymentId',
  foreignField: '_id',
  justOne: true,
});

orderSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.getFullYear().toString().substring(2) +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${dateStr}-${random}`;
  }
  if (!this.statusHistory || this.statusHistory.length === 0) {
    this.statusHistory = [{ status: 'pending', timestamp: new Date() }];
  }
  next();
});

orderSchema.methods.updateStatus = function(newStatus, userId, note) {
  const validTransitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['out_for_delivery'],
    out_for_delivery: ['delivered', 'cancelled'],
    delivered: ['returned'],
    returned: [],
    cancelled: [],
  };

  if (!validTransitions[this.status]?.includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    updatedBy: userId,
    note,
  });

  return this.save();
};

orderSchema.methods.getStatusTimeline = function() {
  const timeline = {
    pending: null,
    confirmed: null,
    processing: null,
    packed: null,
    shipped: null,
    out_for_delivery: null,
    delivered: null,
    returned: null,
    cancelled: null,
  };

  this.statusHistory.forEach(entry => {
    timeline[entry.status] = entry.timestamp;
  });

  return timeline;
};

module.exports = mongoose.model('Order', orderSchema);
