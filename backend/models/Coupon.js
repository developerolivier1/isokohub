const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  code: {
    type: String,
    required: [true, 'Coupon code is required'],
    uppercase: true,
    trim: true,
    unique: true,
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'free_shipping'],
    required: [true, 'Discount type is required'],
  },
  value: {
    type: Number,
    required: [true, 'Discount value is required'],
    min: [0, 'Value cannot be negative'],
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  maxDiscount: {
    type: Number,
    default: null,
  },
  usageLimit: {
    type: Number,
    default: null,
  },
  usageLimitPerUser: {
    type: Number,
    default: 1,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
  },
  applicableProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  applicableCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  startsAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry date is required'],
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

couponSchema.index({ tenantId: 1, code: 1 }, { unique: true });
couponSchema.index({ tenantId: 1, isActive: 1, expiresAt: 1 });

couponSchema.methods.isValid = async function(userId, orderAmount = 0) {
  if (!this.isActive) return { valid: false, reason: 'Coupon is inactive' };
  if (new Date() < this.startsAt) return { valid: false, reason: 'Coupon not yet active' };
  if (new Date() > this.expiresAt) return { valid: false, reason: 'Coupon has expired' };
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit reached' };
  }
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, reason: `Minimum order amount is ${this.minOrderAmount}` };
  }
  if (this.usageLimitPerUser && userId) {
    const Order = mongoose.model('Order');
    const userUsage = await Order.countDocuments({
      tenantId: this.tenantId,
      userId,
      'coupon.code': this.code,
    });
    if (userUsage >= this.usageLimitPerUser) {
      return { valid: false, reason: 'You have already used this coupon' };
    }
  }
  return { valid: true };
};

couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discount = 0;
  if (this.type === 'percentage') {
    discount = orderAmount * (this.value / 100);
    if (this.maxDiscount) discount = Math.min(discount, this.maxDiscount);
  } else if (this.type === 'fixed') {
    discount = this.value;
  }
  return Math.min(discount, orderAmount);
};

module.exports = mongoose.model('Coupon', couponSchema);
