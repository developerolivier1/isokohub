const mongoose = require('mongoose');

const socialPostSchema = new mongoose.Schema({
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
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters'],
  },
  media: [{
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], required: true },
    thumbnail: String,
    alt: String,
  }],
  tags: [String],
  mentions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
  }],
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    image: String,
  }],
  type: {
    type: String,
    enum: ['post', 'review', 'offer', 'announcement'],
    default: 'post',
  },
  privacy: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public',
  },
  metrics: {
    likes: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

socialPostSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
socialPostSchema.index({ tenantId: 1, type: 1, createdAt: -1 });
socialPostSchema.index({ tenantId: 1, isActive: 1, isFeatured: 1 });
socialPostSchema.index({ content: 'text', tags: 'text' });
socialPostSchema.index({ 'products.productId': 1 });

socialPostSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'targetId',
  match: { targetType: 'post' },
});

module.exports = mongoose.model('SocialPost', socialPostSchema);
