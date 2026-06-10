const mongoose = require('mongoose');

const trendingSearchSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
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
  score: {
    type: Number,
    default: 0,
  },
  searchCount: {
    type: Number,
    default: 0,
  },
  uniqueUserCount: {
    type: Number,
    default: 0,
  },
  clickCount: {
    type: Number,
    default: 0,
  },
  conversionCount: {
    type: Number,
    default: 0,
  },
  resultCount: {
    type: Number,
    default: 0,
  },
  category: String,
  relatedQueries: [String],
  trend: {
    type: String,
    enum: ['rising', 'stable', 'falling', 'new'],
    default: 'new',
  },
  velocity: {
    type: Number,
    default: 0,
  },
  period: {
    type: String,
    enum: ['hourly', 'daily', 'weekly'],
    default: 'daily',
  },
  expiresAt: {
    type: Date,
    index: { expireAfterSeconds: 0 },
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

trendingSearchSchema.index({ tenantId: 1, score: -1 });
trendingSearchSchema.index({ tenantId: 1, normalizedQuery: 1 }, { unique: true });
trendingSearchSchema.index({ tenantId: 1, trend: 1, score: -1 });
trendingSearchSchema.index({ tenantId: 1, period: 1, score: -1 });

trendingSearchSchema.statics.getTrending = async function(tenantId, { limit = 20, period = 'daily' } = {}) {
  return this.find({ tenantId, period })
    .sort({ score: -1 })
    .limit(limit)
    .select('query score searchCount uniqueUserCount clickCount trend category')
    .lean();
};

trendingSearchSchema.statics.increment = async function(tenantId, query, { userId, resultCount } = {}) {
  const normalized = query.toLowerCase().trim();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return this.findOneAndUpdate(
    { tenantId, normalizedQuery: normalized, period: 'daily' },
    {
      $setOnInsert: { query, period: 'daily', expiresAt },
      $inc: { searchCount: 1, score: 1 },
      $max: { resultCount: resultCount || 0 },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

trendingSearchSchema.statics.recordClick = async function(tenantId, query) {
  const normalized = query.toLowerCase().trim();
  return this.findOneAndUpdate(
    { tenantId, normalizedQuery: normalized },
    { $inc: { clickCount: 1, score: 0.5 } },
  );
};

trendingSearchSchema.statics.recordConversion = async function(tenantId, query) {
  const normalized = query.toLowerCase().trim();
  return this.findOneAndUpdate(
    { tenantId, normalizedQuery: normalized },
    { $inc: { conversionCount: 1, score: 2 } },
  );
};

trendingSearchSchema.statics.computeTrends = async function(tenantId) {
  return this.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), period: 'daily' } },
    { $group: { _id: '$normalizedQuery', totalScore: { $sum: '$score' }, docs: { $push: '$$ROOT' } } },
    { $sort: { totalScore: -1 } },
    { $limit: 100 },
  ]);
};

module.exports = mongoose.model('TrendingSearch', trendingSearchSchema);
