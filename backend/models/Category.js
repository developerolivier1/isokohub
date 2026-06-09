const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [100, 'Category name cannot exceed 100 characters'],
  },
  slug: {
    type: String,
    required: [true, 'Category slug is required'],
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  icon: String,
  image: String,
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
  level: {
    type: Number,
    default: 0,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    metaKeywords: [String],
  },
  attributes: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'select', 'color', 'boolean'], default: 'text' },
    required: { type: Boolean, default: false },
    options: [String],
    filterable: { type: Boolean, default: false },
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

categorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });
categorySchema.index({ tenantId: 1, parent: 1 });
categorySchema.index({ tenantId: 1, isActive: 1, sortOrder: 1 });
categorySchema.index({ name: 'text', description: 'text' });

categorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
});

categorySchema.virtual('products', {
  ref: 'Product',
  localField: '_id',
  foreignField: 'category',
});

categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

categorySchema.pre('save', async function(next) {
  if (this.parent) {
    const parent = await mongoose.model('Category').findById(this.parent);
    if (parent) {
      this.level = parent.level + 1;
    }
  } else {
    this.level = 0;
  }
  next();
});

categorySchema.statics.getTree = async function(tenantId) {
  const categories = await this.find({ tenantId, isActive: true })
    .sort({ sortOrder: 1 })
    .lean();

  const map = {};
  const roots = [];

  categories.forEach(cat => {
    map[cat._id] = { ...cat, children: [] };
  });

  categories.forEach(cat => {
    if (cat.parent && map[cat.parent]) {
      map[cat.parent].children.push(map[cat._id]);
    } else if (!cat.parent) {
      roots.push(map[cat._id]);
    }
  });

  return roots;
};

module.exports = mongoose.model('Category', categorySchema);
