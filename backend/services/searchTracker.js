const SearchAnalytics = require('../models/SearchAnalytics');
const SearchHistory = require('../models/SearchHistory');
const TrendingSearch = require('../models/TrendingSearch');
const logger = require('../utils/logger');

class SearchTracker {
  async trackSearch(tenantId, query, options = {}) {
    try {
      const {
        userId, sessionId, filters, resultCount, totalResults,
        searchType = 'text', searchEngine, responseTimeMs,
        language = 'en', deviceType = 'unknown', referrer,
        hasResults, metadata,
      } = options;

      const normalized = query?.toLowerCase().trim();

      await SearchAnalytics.create({
        tenantId,
        query,
        normalizedQuery: normalized,
        userId,
        sessionId,
        filters,
        resultCount: resultCount || 0,
        totalResults: totalResults || 0,
        searchType,
        searchEngine: searchEngine || 'text_index',
        responseTimeMs: responseTimeMs || 0,
        language,
        deviceType,
        referrer,
        hasResults: hasResults !== undefined ? hasResults : (resultCount > 0),
        metadata,
      });

      if (userId) {
        await SearchHistory.create({
          tenantId,
          userId,
          query,
          normalizedQuery: normalized,
          filters: filters || {},
          resultCount: resultCount || 0,
          searchType,
        });
      }

      await TrendingSearch.increment(tenantId, query, { userId, resultCount: resultCount || 0 }).catch(() => {});
    } catch (err) {
      logger.error(`Search tracking error: ${err.message}`);
    }
  }

  async trackClick(tenantId, query, productId, position, options = {}) {
    try {
      const { userId, sessionId } = options;

      await SearchAnalytics.updateMany(
        {
          tenantId,
          ...(userId ? { userId } : { sessionId }),
          query,
          createdAt: { $gte: new Date(Date.now() - 3600000) },
        },
        {
          $inc: { clickCount: 1 },
          $push: { clickedProducts: { productId, position, timestamp: new Date() } },
        },
      );

      if (userId) {
        await SearchHistory.updateMany(
          { tenantId, userId, normalizedQuery: query?.toLowerCase().trim() },
          { $set: { clickedProductId: productId } },
        );
      }

      await TrendingSearch.recordClick(tenantId, query).catch(() => {});
    } catch (err) {
      logger.error(`Click tracking error: ${err.message}`);
    }
  }

  async trackConversion(tenantId, query, orderId, value, options = {}) {
    try {
      const { userId, sessionId } = options;

      await SearchAnalytics.updateMany(
        {
          tenantId,
          ...(userId ? { userId } : { sessionId }),
          query,
          createdAt: { $gte: new Date(Date.now() - 86400000) },
        },
        {
          $inc: { conversionCount: 1, conversionValue: value || 0 },
        },
      );

      if (userId) {
        await SearchHistory.updateMany(
          { tenantId, userId, normalizedQuery: query?.toLowerCase().trim() },
          { $set: { converted: true } },
        );
      }

      await TrendingSearch.recordConversion(tenantId, query).catch(() => {});
    } catch (err) {
      logger.error(`Conversion tracking error: ${err.message}`);
    }
  }

  async trackBounce(tenantId, query, options = {}) {
    try {
      const { userId, sessionId } = options;

      await SearchAnalytics.updateMany(
        {
          tenantId,
          ...(userId ? { userId } : { sessionId }),
          query,
          createdAt: { $gte: new Date(Date.now() - 3600000) },
        },
        { $inc: { bounceCount: 1 } },
      );
    } catch (err) {
      logger.error(`Bounce tracking error: ${err.message}`);
    }
  }

  async trackDwellTime(tenantId, query, dwellTimeMs, options = {}) {
    try {
      const { userId, sessionId } = options;

      await SearchAnalytics.updateMany(
        {
          tenantId,
          ...(userId ? { userId } : { sessionId }),
          query,
          createdAt: { $gte: new Date(Date.now() - 3600000) },
        },
        { $max: { dwellTime: dwellTimeMs } },
      );
    } catch (err) {
      logger.error(`Dwell time tracking error: ${err.message}`);
    }
  }

  async getSearchAnalytics(tenantId, options = {}) {
    return SearchAnalytics.getSearchAnalytics(tenantId, options);
  }

  async getPopularSearches(tenantId, options = {}) {
    return SearchAnalytics.getPopularSearches(tenantId, options);
  }

  async getZeroResultQueries(tenantId, options = {}) {
    return SearchAnalytics.getZeroResultQueries(tenantId, options);
  }

  async getUserSearchHistory(tenantId, userId, options = {}) {
    return SearchHistory.getUserHistory(tenantId, userId, options);
  }

  async clearUserSearchHistory(tenantId, userId) {
    return SearchHistory.clearUserHistory(tenantId, userId);
  }
}

module.exports = new SearchTracker();
