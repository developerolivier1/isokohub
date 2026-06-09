const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Campaign name is required'],
    maxlength: [200, 'Name cannot exceed 200 characters'],
  },
  type: {
    type: String,
    enum: ['email', 'sms', 'push', 'social', 'ads'],
    required: [true, 'Campaign type is required'],
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft',
  },
  audience: {
    type: {
      type: String,
      enum: ['all', 'segment', 'custom'],
      default: 'all',
    },
    segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSegment' },
    customFilters: mongoose.Schema.Types.Mixed,
  },
  content: {
    subject: String,
    body: { type: String, required: true },
    templateId: String,
    variables: [String],
    mediaUrls: [String],
    cta: {
      text: String,
      url: String,
    },
  },
  schedule: {
    sendAt: Date,
    timezone: String,
    frequency: { type: String, enum: ['once', 'daily', 'weekly', 'monthly'] },
    endDate: Date,
    maxSends: Number,
  },
  metrics: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    converted: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  budget: {
    total: Number,
    spent: { type: Number, default: 0 },
    currency: { type: String, default: 'RWF' },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

campaignSchema.index({ tenantId: 1, status: 1 });
campaignSchema.index({ tenantId: 1, type: 1 });
campaignSchema.index({ 'schedule.sendAt': 1, status: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
