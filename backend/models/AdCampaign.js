const mongoose = require('mongoose');

const adCampaignSchema = new mongoose.Schema({
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
    required: [true, 'Campaign name is required'],
    maxlength: [200, 'Name cannot exceed 200 characters'],
  },
  objective: {
    type: String,
    enum: ['brand_awareness', 'traffic', 'conversions', 'engagement', 'sales'],
    required: [true, 'Campaign objective is required'],
  },
  ads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Advertisement',
  }],
  budget: {
    type: Number,
    required: [true, 'Budget is required'],
    min: 0,
  },
  spent: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'RWF',
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
  },
  endDate: Date,
  metrics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    ctr: { type: Number, default: 0 },
    cpc: { type: Number, default: 0 },
    cpm: { type: Number, default: 0 },
    spend: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
    roas: { type: Number, default: 0 },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

adCampaignSchema.index({ tenantId: 1, vendorId: 1 });
adCampaignSchema.index({ tenantId: 1, status: 1 });
adCampaignSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('AdCampaign', adCampaignSchema);
