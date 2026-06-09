const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
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
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true,
    minlength: [2, 'Store name must be at least 2 characters'],
    maxlength: [100, 'Store name cannot exceed 100 characters'],
  },
  storeSlug: {
    type: String,
    required: [true, 'Store slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  storeLogo: String,
  storeBanner: String,
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
  },
  contactPhone: {
    type: String,
    required: [true, 'Contact phone is required'],
  },
  address: {
    street: String,
    city: { type: String, required: true },
    state: String,
    zipCode: String,
    country: { type: String, default: 'RW' },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'suspended', 'rejected'],
    default: 'pending',
  },
  verification: {
    businessLicense: String,
    taxId: String,
    identityDocument: String,
    additionalDocs: [String],
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    rejectionReason: String,
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  productCount: {
    type: Number,
    default: 0,
  },
  totalSales: {
    type: Number,
    default: 0,
  },
  totalRevenue: {
    type: Number,
    default: 0,
  },
  commissionRate: {
    type: Number,
    min: 0,
    max: 100,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  settings: {
    autoAcceptOrders: { type: Boolean, default: true },
    maxOrderPerDay: { type: Number, default: 100 },
    shippingMethods: [{
      name: String,
      price: Number,
      estimatedDays: String,
    }],
    returnPolicy: String,
    paymentMethods: [String],
  },
  socialLinks: {
    facebook: String,
    instagram: String,
    twitter: String,
    whatsapp: String,
  },
  businessHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } },
  },
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

vendorSchema.index({ tenantId: 1, storeSlug: 1 }, { unique: true });
vendorSchema.index({ tenantId: 1, status: 1 });
vendorSchema.index({ userId: 1 }, { unique: true });
vendorSchema.index({ location: '2dsphere' });
vendorSchema.index({ 'ratings.average': -1 });
vendorSchema.index({ isFeatured: 1, status: 1 });
vendorSchema.index({ storeName: 'text', description: 'text' });

vendorSchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'vendorId',
});

vendorSchema.pre('save', function(next) {
  if (this.isModified('storeName') && !this.storeSlug) {
    this.storeSlug = this.storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

vendorSchema.methods.toPublicProfile = function() {
  return {
    id: this._id,
    storeName: this.storeName,
    storeSlug: this.storeSlug,
    storeLogo: this.storeLogo,
    storeBanner: this.storeBanner,
    description: this.description,
    ratings: this.ratings,
    productCount: this.productCount,
    totalSales: this.totalSales,
    address: this.address,
    socialLinks: this.socialLinks,
    businessHours: this.businessHours,
    isFeatured: this.isFeatured,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('Vendor', vendorSchema);
