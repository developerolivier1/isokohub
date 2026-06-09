const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  variantId: mongoose.Schema.Types.ObjectId,
  addedAt: {
    type: Date,
    default: Date.now,
  },
  priceAtAddition: Number,
});

const wishlistSchema = new mongoose.Schema({
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
  name: {
    type: String,
    default: 'Default Wishlist',
    trim: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  items: [wishlistItemSchema],
  shareCode: {
    type: String,
    unique: true,
    sparse: true,
  },
}, {
  timestamps: true,
});

wishlistSchema.index({ tenantId: 1, userId: 1 });
wishlistSchema.index({ shareCode: 1 }, { sparse: true });

wishlistSchema.pre('validate', function(next) {
  if (this.isPublic && !this.shareCode) {
    const crypto = require('crypto');
    this.shareCode = crypto.randomBytes(4).toString('hex');
  }
  next();
});

wishlistSchema.methods.addProduct = function(productId, variantId, price) {
  const exists = this.items.some(i =>
    i.productId.toString() === productId.toString() &&
    (!variantId || i.variantId?.toString() === variantId?.toString())
  );
  if (!exists) {
    this.items.push({ productId, variantId, priceAtAddition: price });
  }
  return this.save();
};

wishlistSchema.methods.removeProduct = function(productId, variantId) {
  this.items = this.items.filter(i =>
    !(i.productId.toString() === productId.toString() &&
      (!variantId || i.variantId?.toString() === variantId?.toString()))
  );
  return this.save();
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
