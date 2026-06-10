const mongoose = require('mongoose');

const searchAnalyticsSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  query: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  normalizedQuery: {
    type: String,
    trim: true,
    lowercase: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  sessionId: String,
  filters: {
    category: String,
    minPrice: Number,
    maxPrice: Number,
    sort: String,
    vendor: String,
    tags: [String],
    attributes: mongoose.Schema.Types.Mixed,
  },
  resultCount: {
    type: Number,
    default: 0,
  },
  totalResults: {
    type: Number,
    default: 0,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  clickedProducts: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    position: Number,
    timestamp: Date,
  }],
  conversionCount: {
    type: Number,
    default: 0,
  },
  conversionValue: {
    type: Number,
    default: 0,
  },
  dwellTime: {
    type: Number,
    default: 0,
  },
  bounceCount: {
    type: Number,
    default: 0,
  },
  searchType: {
    type: String,
    enum: ['text', 'voice', 'image', 'barcode', 'semantic', 'autocomplete', 'suggestion'],
    default: 'text',
  },
  searchEngine: {
    type: String,
    enum: ['atlas_search', 'text_index', 'regex_fallback'],
    default: 'text_index',
  },
  responseTimeMs: {
    type: Number,
    default: 0,
  },
  language: {
    type: String,
    default: 'en',
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  referrer: String,
  hasResults: Boolean,
  abandoned: Boolean,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

searchAnalyticsSchema.index({ tenantId: 1, createdAt: -1 });
searchAnalyticsSchema.index({ tenantId: 1, query: 1, createdAt: -1 });
searchAnalyticsSchema.index({ tenantId: 1, normalizedQuery: 1 });
searchAnalyticsSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
searchAnalyticsSchema.index({ tenantId: 1, searchType: 1, createdAt: -1 });
searchAnalyticsSchema.index({ tenantId: 1, hasResults: 1 });
searchAnalyticsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

searchAnalyticsSchema.statics.getPopularSearches = async function(tenantId, { limit = 20, days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: since } } },
    { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' }, avgResults: { $avg: '$resultCount' }, clickRate: { $avg: { $cond: [{ $gt: ['$clickCount', 0] }, 1, 0] } } } },
    { $project: { query: '$_id', count: 1, uniqueUsers: { $size: '$uniqueUsers' }, avgResults: 1, clickRate: 1 } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
};

searchAnalyticsSchema.statics.getSearchAnalytics = async function(tenantId, { startDate, endDate, groupBy = 'day' } = {}) {
  const match = { tenantId: new mongoose.Types.ObjectId(tenantId) };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  let dateGroup;
  if (groupBy === 'hour') dateGroup = { $dateToString: { format: '%Y-%m-%d-%H', date: '$createdAt' } };
  else if (groupBy === 'week') dateGroup = { $dateToString: { format: '%Y-%U', date: '$createdAt' } };
  else if (groupBy === 'month') dateGroup = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  else dateGroup = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  return this.aggregate([
    { $match: match },
    { $group: {
      _id: dateGroup,
      totalSearches: { $sum: 1 },
      uniqueSearches: { $addToSet: '$normalizedQuery' },
      totalClicks: { $sum: '$clickCount' },
      totalConversions: { $sum: '$conversionCount' },
      totalBounces: { $sum: '$bounceCount' },
      avgResponseTime: { $avg: '$responseTimeMs' },
      noResultSearches: { $sum: { $cond: [{ $eq: ['$hasResults', false] }, 1, 0] } },
    } },
    { $project: {
      date: '$_id',
      totalSearches: 1,
      uniqueSearches: { $size: '$uniqueSearches' },
      totalClicks: 1,
      totalConversions: 1,
      totalBounces: 1,
      avgResponseTime: 1,
      noResultSearches: 1,
      clickThroughRate: { $cond: [{ $gt: ['$totalSearches', 0] }, { $divide: ['$totalClicks', '$totalSearches'] }, 0] },
      conversionRate: { $cond: [{ $gt: ['$totalClicks', 0] }, { $divide: ['$totalConversions', '$totalClicks'] }, 0] },
      bounceRate: { $cond: [{ $gt: ['$totalSearches', 0] }, { $divide: ['$totalBounces', '$totalSearches'] }, 0] },
    } },
    { $sort: { date: -1 } },
  ]);
};

searchAnalyticsSchema.statics.getZeroResultQueries = async function(tenantId, { limit = 50, days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return this.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), createdAt: { $gte: since }, hasResults: false } },
    { $group: { _id: '$query', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
};

module.exports = mongoose.model('SearchAnalytics', searchAnalyticsSchema);
