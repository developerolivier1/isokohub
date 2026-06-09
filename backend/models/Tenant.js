const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
    minlength: [2, 'Tenant name must be at least 2 characters'],
    maxlength: [100, 'Tenant name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Tenant slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers and hyphens'],
  },
  domain: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  customDomain: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  logo: {
    type: String,
    default: null,
  },
  favicon: {
    type: String,
    default: null,
  },
  primaryColor: {
    type: String,
    default: '#667eea',
  },
  secondaryColor: {
    type: String,
    default: '#764ba2',
  },
  plan: {
    type: String,
    enum: ['basic', 'professional', 'enterprise'],
    default: process.env.DEFAULT_TENANT_PLAN || 'basic',
  },
  planStatus: {
    type: String,
    enum: ['active', 'suspended', 'cancelled', 'trial'],
    default: 'trial',
  },
  planExpiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  maxVendors: {
    type: Number,
    default: function() {
      const limits = { basic: 10, professional: 50, enterprise: 999999 };
      return limits[this.plan] || 10;
    },
  },
  maxProducts: {
    type: Number,
    default: function() {
      const limits = { basic: 100, professional: 1000, enterprise: 999999 };
      return limits[this.plan] || 100;
    },
  },
  features: {
    liveStreaming: { type: Boolean, default: false },
    multiWarehouse: { type: Boolean, default: false },
    aiRecommendations: { type: Boolean, default: false },
    affiliateProgram: { type: Boolean, default: false },
    customDomain: { type: Boolean, default: false },
    apiAccess: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    prioritySupport: { type: Boolean, default: false },
  },
  currency: {
    type: String,
    default: process.env.DEFAULT_CURRENCY || 'RWF',
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
  },
  country: {
    type: String,
    default: process.env.DEFAULT_COUNTRY || 'RW',
    maxlength: [3, 'Country code must be 2-3 characters'],
  },
  timezone: {
    type: String,
    default: 'Africa/Kigali',
  },
  language: {
    type: String,
    default: 'en',
    enum: ['en', 'rw', 'fr', 'sw'],
  },
  commissionRate: {
    type: Number,
    default: parseFloat(process.env.PLATFORM_COMMISSION_PERCENT) || 5,
    min: 0,
    max: 100,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  setupComplete: {
    type: Boolean,
    default: false,
  },
  stripeAccountId: String,
  paypalMerchantId: String,
  mtnApiKey: String,
  airtelApiKey: String,
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

tenantSchema.index({ plan: 1, planStatus: 1 });
tenantSchema.index({ isActive: 1, planExpiresAt: 1 });

tenantSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'tenantId',
});

tenantSchema.virtual('vendors', {
  ref: 'Vendor',
  localField: '_id',
  foreignField: 'tenantId',
});

tenantSchema.pre('save', function(next) {
  if (this.isModified('plan')) {
    const limits = {
      basic: { vendors: 10, products: 100 },
      professional: { vendors: 50, products: 1000 },
      enterprise: { vendors: 999999, products: 999999 },
    };
    this.maxVendors = limits[this.plan].vendors;
    this.maxProducts = limits[this.plan].products;
  }
  next();
});

tenantSchema.methods.canAddVendor = async function() {
  const Vendor = mongoose.model('Vendor');
  const count = await Vendor.countDocuments({ tenantId: this._id, isActive: true });
  return count < this.maxVendors;
};

tenantSchema.methods.canAddProduct = async function() {
  const Product = mongoose.model('Product');
  const count = await Product.countDocuments({ tenantId: this._id, status: { $ne: 'deleted' } });
  return count < this.maxProducts;
};

tenantSchema.methods.hasFeature = function(feature) {
  return this.features && this.features[feature] === true;
};

module.exports = mongoose.model('Tenant', tenantSchema);
