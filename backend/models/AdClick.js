const mongoose = require('mongoose');

const adClickSchema = new mongoose.Schema({
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
  cost: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'RWF',
  },
  converted: {
    type: Boolean,
    default: false,
  },
  conversionValue: Number,
  convertedAt: Date,
}, {
  timestamps: true,
});

adClickSchema.index({ tenantId: 1, adId: 1 });
adClickSchema.index({ tenantId: 1, campaignId: 1 });
adClickSchema.index({ tenantId: 1, createdAt: 1 });
adClickSchema.index({ sessionId: 1 });

module.exports = mongoose.model('AdClick', adClickSchema);
