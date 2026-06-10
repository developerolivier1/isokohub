const mongoose = require('mongoose');

const searchHistorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  query: {
    type: String,
    required: true,
    trim: true,
  },
  normalizedQuery: {
    type: String,
    lowercase: true,
    trim: true,
  },
  filters: {
    category: String,
    minPrice: Number,
    maxPrice: Number,
    sort: String,
  },
  resultCount: Number,
  clickedProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  converted: {
    type: Boolean,
    default: false,
  },
  searchType: {
    type: String,
    enum: ['text', 'voice', 'image', 'barcode', 'semantic', 'autocomplete'],
    default: 'text',
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

searchHistorySchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
searchHistorySchema.index({ tenantId: 1, userId: 1, normalizedQuery: 1 });
searchHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

searchHistorySchema.statics.getUserHistory = async function(tenantId, userId, { limit = 20, includeFilters = false } = {}) {
  const projection = { query: 1, searchType: 1, createdAt: 1, resultCount: 1 };
  if (includeFilters) projection.filters = 1;
  return this.find({ tenantId, userId })
    .select(projection)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

searchHistorySchema.statics.clearUserHistory = async function(tenantId, userId) {
  return this.deleteMany({ tenantId, userId });
};

searchHistorySchema.statics.getUserTrendingQueries = async function(tenantId, userId, { limit = 10 } = {}) {
  return this.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), userId: new mongoose.Types.ObjectId(userId) } },
    { $group: { _id: '$normalizedQuery', count: { $sum: 1 }, lastSearched: { $max: '$createdAt' } } },
    { $sort: { count: -1, lastSearched: -1 } },
    { $limit: limit },
    { $project: { query: '$_id', count: 1, lastSearched: 1 } },
  ]);
};

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
