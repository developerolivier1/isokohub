const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  variantId: mongoose.Schema.Types.ObjectId,
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required'],
  },
  name: String,
  image: String,
  price: {
    type: Number,
    required: [true, 'Price is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1,
  },
  attributes: [{
    name: String,
    value: String,
  }],
});

const cartSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
  },
  items: [cartItemSchema],
  coupon: {
    code: String,
    discount: { type: Number, default: 0 },
    type: { type: String, enum: ['percentage', 'fixed'] },
  },
  subtotal: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    default: 'RWF',
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
}, {
  timestamps: true,
});

cartSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

cartSchema.pre('save', function(next) {
  this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (this.coupon && this.coupon.type === 'percentage') {
    this.discount = this.subtotal * (this.coupon.discount / 100);
  } else if (this.coupon && this.coupon.type === 'fixed') {
    this.discount = this.coupon.discount;
  }
  this.total = Math.max(0, this.subtotal - this.discount);
  next();
});

cartSchema.methods.addItem = function(item) {
  const existingIndex = this.items.findIndex(i =>
    i.productId.toString() === item.productId.toString() &&
    (!item.variantId || i.variantId?.toString() === item.variantId?.toString())
  );
  if (existingIndex > -1) {
    this.items[existingIndex].quantity += item.quantity || 1;
  } else {
    this.items.push(item);
  }
  return this.save();
};

cartSchema.methods.removeItem = function(productId, variantId) {
  this.items = this.items.filter(i =>
    !(i.productId.toString() === productId &&
      (!variantId || i.variantId?.toString() === variantId))
  );
  return this.save();
};

cartSchema.methods.updateQuantity = function(productId, quantity, variantId) {
  const item = this.items.find(i =>
    i.productId.toString() === productId &&
    (!variantId || i.variantId?.toString() === variantId)
  );
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
  return this.save();
};

cartSchema.methods.clear = function() {
  this.items = [];
  this.coupon = undefined;
  return this.save();
};

module.exports = mongoose.model('Cart', cartSchema);
