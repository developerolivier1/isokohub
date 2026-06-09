const mongoose = require('mongoose');

const campaignLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: [true, 'Campaign ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  action: {
    type: String,
    enum: ['sent', 'delivered', 'opened', 'clicked', 'converted', 'bounced', 'unsubscribed', 'complained'],
    required: [true, 'Action is required'],
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: String,
  userAgent: String,
  linkClicked: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

campaignLogSchema.index({ tenantId: 1, campaignId: 1 });
campaignLogSchema.index({ tenantId: 1, userId: 1 });
campaignLogSchema.index({ campaignId: 1, action: 1 });
campaignLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('CampaignLog', campaignLogSchema);
