const mongoose = require('mongoose');

const adImpressionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  adId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
    required: [true, 'Ad ID is required'],
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdCampaign',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sessionId: String,
  ipAddress: String,
  userAgent: String,
  referrer: String,
  placement: String,
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
  },
  os: String,
  browser: String,
  location: {
    latitude: Number,
    longitude: Number,
    city: String,
    country: String,
  },
  viewDuration: {
    type: Number,
    default: 0,
  },
  viewable: {
    type: Boolean,
    default: true,
  },
  cost: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'RWF',
  },
}, {
  timestamps: true,
});

adImpressionSchema.index({ tenantId: 1, adId: 1 });
adImpressionSchema.index({ tenantId: 1, campaignId: 1 });
adImpressionSchema.index({ tenantId: 1, createdAt: 1 });
adImpressionSchema.index({ sessionId: 1 });

module.exports = mongoose.model('AdImpression', adImpressionSchema);
