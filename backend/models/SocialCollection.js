const mongoose = require('mongoose');

const socialCollectionSchema = new mongoose.Schema({
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
    required: [true, 'Collection name is required'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  coverImage: String,
  items: [{
    type: { type: String, enum: ['product', 'post', 'vendor'], required: true },
    itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
    addedAt: { type: Date, default: Date.now },
    note: String,
  }],
  isPublic: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

socialCollectionSchema.index({ tenantId: 1, userId: 1 });
socialCollectionSchema.index({ tenantId: 1, isPublic: 1, isFeatured: 1 });
socialCollectionSchema.index({ 'items.itemId': 1 });

module.exports = mongoose.model('SocialCollection', socialCollectionSchema);
