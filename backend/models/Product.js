const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters'],
    maxlength: [200, 'Product name cannot exceed 200 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Product slug is required'],
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    maxlength: [10000, 'Description cannot exceed 10000 characters'],
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  },
  brand: {
    type: String,
    trim: true,
  },
  sku: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  barcode: String,
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative'],
  },
  comparePrice: {
    type: Number,
    min: 0,
  },
  costPrice: {
    type: Number,
    min: 0,
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    default: 'RWF',
  },
  discount: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  images: [{
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  }],
  videos: [{
    url: String,
    thumbnail: String,
  }],
  attributes: [{
    name: { type: String, required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  }],
  variants: [{
    name: { type: String, required: true },
    sku: String,
    price: { type: Number, required: true },
    comparePrice: Number,
    stock: { type: Number, default: 0 },
    attributes: [{
      name: String,
      value: String,
    }],
    images: [String],
    isActive: { type: Boolean, default: true },
  }],
  tags: [String],
  weight: {
    value: Number,
    unit: { type: String, enum: ['kg', 'g', 'lb', 'oz'], default: 'kg' },
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    unit: { type: String, enum: ['cm', 'm', 'in'], default: 'cm' },
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'inactive', 'deleted'],
    default: 'draft',
  },
  featured: {
    type: Boolean,
    default: false,
  },
  isDigital: {
    type: Boolean,
    default: false,
  },
  digitalFile: {
    url: String,
    downloadLimit: Number,
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
  },
  ratings: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  totalSold: {
    type: Number,
    default: 0,
  },
  minOrderQuantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  maxOrderQuantity: {
    type: Number,
    default: 999,
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

productSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
productSchema.index({ tenantId: 1, vendorId: 1 });
productSchema.index({ tenantId: 1, category: 1 });
productSchema.index({ tenantId: 1, status: 1, featured: 1 });
productSchema.index({ tenantId: 1, 'ratings.average': -1 });
productSchema.index({ tenantId: 1, totalSold: -1 });
productSchema.index({ price: 1 });
productSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
productSchema.index({
  name: 'text',
  description: 'text',
  brand: 'text',
  tags: 'text',
}, {
  weights: { name: 10, brand: 5, tags: 3, description: 1 },
  name: 'product_search_index',
});
productSchema.index({ 'attributes.name': 1, 'attributes.value': 1 });

productSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'productId',
});

productSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 200);
  }
  if (this.isModified('price') || this.isModified('comparePrice')) {
    if (this.comparePrice && this.comparePrice > this.price) {
      this.discount = Math.round((1 - this.price / this.comparePrice) * 100);
    } else {
      this.discount = 0;
    }
  }
  next();
});

productSchema.methods.getFinalPrice = function(quantity = 1) {
  return this.price * quantity;
};

productSchema.methods.isInStock = function(quantity = 1) {
  return this.variants && this.variants.length > 0
    ? this.variants.some(v => v.isActive && v.stock >= quantity)
    : true;
};

productSchema.statics.search = async function(tenantId, query, options = {}) {
  const filter = { tenantId, status: 'active' };
  if (query) {
    filter.$text = { $search: query };
  }
  if (options.category) filter.category = options.category;
  if (options.minPrice || options.maxPrice) {
    filter.price = {};
    if (options.minPrice) filter.price.$gte = parseFloat(options.minPrice);
    if (options.maxPrice) filter.price.$lte = parseFloat(options.maxPrice);
  }
  const sort = options.sort || { createdAt: -1 };
  const page = parseInt(options.page) || 1;
  const limit = parseInt(options.limit) || 20;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    this.find(filter).sort(sort).skip(skip).limit(limit).populate('category', 'name slug'),
    this.countDocuments(filter),
  ]);

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

module.exports = mongoose.model('Product', productSchema);
