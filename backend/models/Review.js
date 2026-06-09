const mongoose = require('mongoose');

const reviewImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
});

const reviewSchema = new mongoose.Schema({
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
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: [true, 'Vendor ID is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5'],
  },
  title: {
    type: String,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  body: {
    type: String,
    required: [true, 'Review body is required'],
    maxlength: [5000, 'Review cannot exceed 5000 characters'],
  },
  images: [reviewImageSchema],
  isVerifiedPurchase: {
    type: Boolean,
    default: false,
  },
  isApproved: {
    type: Boolean,
    default: false,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  reportedCount: {
    type: Number,
    default: 0,
  },
  response: {
    body: String,
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    respondedAt: Date,
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  moderatedAt: Date,
  moderationNote: String,
}, {
  timestamps: true,
});

reviewSchema.index({ tenantId: 1, productId: 1, isApproved: 1 });
reviewSchema.index({ tenantId: 1, userId: 1 });
reviewSchema.index({ tenantId: 1, vendorId: 1 });
reviewSchema.index({ productId: 1, rating: -1 });
reviewSchema.index({ tenantId: 1, isApproved: 1, createdAt: -1 });
reviewSchema.index({ tenantId: 1, productId: 1, userId: 1 }, { unique: true });

reviewSchema.pre('save', async function(next) {
  if (this.isModified('rating') || this.isNew) {
    const stats = await mongoose.model('Review').aggregate([
      { $match: { productId: this.productId, tenantId: this.tenantId, isApproved: true } },
      { $group: { _id: '$productId', average: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    if (stats.length > 0) {
      await mongoose.model('Product').updateOne(
        { _id: this.productId },
        { 'ratings.average': Math.round(stats[0].average * 10) / 10, 'ratings.count': stats[0].count }
      );
    }
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);
