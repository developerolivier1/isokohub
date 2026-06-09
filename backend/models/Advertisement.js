const mongoose = require('mongoose');

const advertisementSchema = new mongoose.Schema({
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
    required: [true, 'Ad name is required'],
    maxlength: [200, 'Name cannot exceed 200 characters'],
  },
  type: {
    type: String,
    enum: ['banner', 'product', 'video', 'search', 'social'],
    required: [true, 'Ad type is required'],
  },
  placement: {
    type: String,
    enum: ['home_top', 'home_middle', 'home_bottom', 'sidebar', 'search_results', 'product_page', 'category_page', 'checkout'],
    required: [true, 'Placement is required'],
  },
  content: {
    title: String,
    description: String,
    imageUrl: String,
    videoUrl: String,
    linkUrl: String,
    ctaText: { type: String, default: 'Shop Now' },
  },
  targetProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  targetUrl: String,
  bidType: {
    type: String,
    enum: ['cpc', 'cpm', 'cpa'],
    default: 'cpc',
  },
  bidAmount: {
    type: Number,
    required: [true, 'Bid amount is required'],
    min: 0,
  },
  dailyBudget: {
    type: Number,
    required: [true, 'Daily budget is required'],
  },
  totalBudget: {
    type: Number,
    required: [true, 'Total budget is required'],
  },
  spent: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    enum: ['RWF', 'USD', 'EUR', 'GBP'],
    default: 'RWF',
  },
  targeting: {
    locations: [String],
    ageRange: { min: Number, max: Number },
    genders: [String],
    interests: [String],
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    devices: [String],
    operatingSystems: [String],
    browsers: [String],
    customAudience: [String],
  },
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    dayParts: [{
      day: { type: String, enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      startTime: String,
      endTime: String,
    }],
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'active', 'paused', 'completed', 'cancelled', 'rejected'],
    default: 'draft',
  },
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
  isActive: {
    type: Boolean,
    default: false,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  rejectionReason: String,
}, {
  timestamps: true,
});

advertisementSchema.index({ tenantId: 1, vendorId: 1 });
advertisementSchema.index({ tenantId: 1, status: 1 });
advertisementSchema.index({ tenantId: 1, placement: 1, isActive: 1 });
advertisementSchema.index({ tenantId: 1, type: 1 });
advertisementSchema.index({ status: 1, 'schedule.startDate': 1, 'schedule.endDate': 1 });

module.exports = mongoose.model('Advertisement', advertisementSchema);
