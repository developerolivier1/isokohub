const mongoose = require('mongoose');

const liveStreamProductSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  liveStreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveStream',
    required: [true, 'Live Stream ID is required'],
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
  specialPrice: {
    type: Number,
    min: 0,
  },
  originalPrice: {
    type: Number,
    min: 0,
  },
  discountPercent: {
    type: Number,
    min: 0,
    max: 100,
  },
  quantity: {
    type: Number,
    default: 0,
  },
  soldCount: {
    type: Number,
    default: 0,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  pinnedAt: Date,
}, {
  timestamps: true,
});

liveStreamProductSchema.index({ tenantId: 1, liveStreamId: 1, displayOrder: 1 });
liveStreamProductSchema.index({ tenantId: 1, productId: 1 });
liveStreamProductSchema.index({ liveStreamId: 1, isActive: 1 });

liveStreamProductSchema.pre('save', function(next) {
  if (this.specialPrice && this.originalPrice) {
    this.discountPercent = Math.round((1 - this.specialPrice / this.originalPrice) * 100);
  }
  next();
});

module.exports = mongoose.model('LiveStreamProduct', liveStreamProductSchema);
