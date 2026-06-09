const mongoose = require('mongoose');

const liveStreamSchema = new mongoose.Schema({
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
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Host ID is required'],
  },
  title: {
    type: String,
    required: [true, 'Stream title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  thumbnail: String,
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended', 'cancelled'],
    default: 'scheduled',
  },
  scheduledAt: Date,
  startedAt: Date,
  endedAt: Date,
  streamKey: {
    type: String,
    required: true,
    unique: true,
  },
  playbackUrl: String,
  rtmpUrl: String,
  viewerCount: {
    type: Number,
    default: 0,
  },
  maxViewers: {
    type: Number,
    default: 1000,
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveStreamProduct',
  }],
  tags: [String],
  isChatEnabled: {
    type: Boolean,
    default: true,
  },
  isRecording: {
    type: Boolean,
    default: true,
  },
  recordingUrl: String,
  reactions: {
    likes: { type: Number, default: 0 },
    hearts: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
  },
  metrics: {
    peakViewers: { type: Number, default: 0 },
    totalViews: { type: Number, default: 0 },
    avgWatchTime: { type: Number, default: 0 },
    productsSold: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 },
  },
  settings: {
    requireFollow: { type: Boolean, default: false },
    ageRestriction: { type: Boolean, default: false },
    moderation: { type: Boolean, default: true },
  },
  coHosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, {
  timestamps: true,
});

liveStreamSchema.index({ tenantId: 1, vendorId: 1, status: 1 });
liveStreamSchema.index({ tenantId: 1, status: 1, scheduledAt: 1 });
liveStreamSchema.index({ status: 1, startedAt: -1 });

liveStreamSchema.methods.startStream = function() {
  this.status = 'live';
  this.startedAt = new Date();
  return this.save();
};

liveStreamSchema.methods.endStream = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  return this.save();
};

liveStreamSchema.methods.incrementViewer = function() {
  this.viewerCount += 1;
  if (this.viewerCount > this.metrics.peakViewers) {
    this.metrics.peakViewers = this.viewerCount;
  }
  this.metrics.totalViews += 1;
  return this.save();
};

liveStreamSchema.methods.decrementViewer = function() {
  this.viewerCount = Math.max(0, this.viewerCount - 1);
  return this.save();
};

module.exports = mongoose.model('LiveStream', liveStreamSchema);
