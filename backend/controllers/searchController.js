const searchEngine = require('../services/searchEngine');
const searchIndexer = require('../services/searchIndexer');
const searchTracker = require('../services/searchTracker');
const logger = require('../utils/logger');

exports.search = async (req, res) => {
  try {
    const {
      q, category, minPrice, maxPrice, vendor, tags,
      sort, page = 1, limit = 20, fuzzy = 'true', language,
      inStock, featured,
    } = req.query;

    const query = q || '';

    const searchOptions = {
      category,
      minPrice,
      maxPrice,
      vendor,
      tags: tags ? tags.split(',') : undefined,
      sort: sort || 'relevance',
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      fuzzy: fuzzy === 'true',
      language: language || req.searchOptimized?.language || 'en',
      inStock: inStock === 'true',
      featured: featured === 'true',
      userId: req.user?._id,
      searchType: 'text',
    };

    const result = await searchEngine.search(req.tenantId, query, searchOptions);

    await searchTracker.trackSearch(req.tenantId, query, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
      filters: { category, minPrice, maxPrice, sort },
      resultCount: result.results?.length || 0,
      totalResults: result.total,
      searchEngine: result.engine,
      responseTimeMs: result.responseTimeMs,
      language: searchOptions.language,
      deviceType: req.headers['user-agent']?.includes('Mobile') ? 'mobile' : req.headers['user-agent']?.includes('Tablet') ? 'tablet' : 'desktop',
      referrer: req.headers.referer,
      hasResults: result.total > 0,
      metadata: { page, limit: searchOptions.limit },
    });

    res.json({
      success: true,
      data: {
        products: result.results,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
        meta: {
          query: result.query,
          engine: result.engine,
          responseTimeMs: result.responseTimeMs,
          filters: searchOptions,
        },
      },
    });
  } catch (err) {
    logger.error(`Search error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Search failed' } });
  }
};

exports.autocomplete = async (req, res) => {
  try {
    const { q, limit = 10, language } = req.query;

    if (!q || q.length < 2) {
      return res.json({ success: true, data: { suggestions: [], products: [], brands: [], categories: [] } });
    }

    const result = await searchEngine.autocomplete(req.tenantId, q, {
      limit: parseInt(limit),
      userId: req.user?._id,
      language: language || 'en',
    });

    res.json({ success: true, data: result });
  } catch (err) {
    logger.error(`Autocomplete error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Autocomplete failed' } });
  }
};

exports.trending = async (req, res) => {
  try {
    const { limit = 20, period = 'daily' } = req.query;
    const trending = await searchEngine.getTrendingSearches(req.tenantId, {
      limit: parseInt(limit),
      period,
    });
    res.json({ success: true, data: { trending } });
  } catch (err) {
    logger.error(`Trending error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch trending searches' } });
  }
};

exports.suggestions = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || q.length < 2) {
      return res.json({ success: true, data: { suggestions: [] } });
    }
    const result = await searchEngine.getSearchSuggestions(req.tenantId, q, {
      limit: parseInt(limit),
      userId: req.user?._id,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    logger.error(`Suggestions error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch suggestions' } });
  }
};

exports.barcodeSearch = async (req, res) => {
  try {
    const { code } = req.params;
    if (!code) {
      return res.status(400).json({ success: false, error: { message: 'Barcode is required' } });
    }
    const product = await searchEngine.barcodeSearch(req.tenantId, code);
    if (!product) {
      return res.status(404).json({ success: false, error: { message: 'Product not found for this barcode' } });
    }
    res.json({ success: true, data: { product } });
  } catch (err) {
    logger.error(`Barcode search error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Barcode search failed' } });
  }
};

exports.semanticSearch = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: { message: 'Query is required' } });
    }
    const result = await searchEngine.semanticSearch(req.tenantId, q, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      userId: req.user?._id,
    });

    await searchTracker.trackSearch(req.tenantId, q, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
      resultCount: result.results?.length || 0,
      totalResults: result.total,
      searchType: 'semantic',
      searchEngine: result.engine,
      responseTimeMs: result.responseTimeMs,
      hasResults: result.total > 0,
    });

    res.json({
      success: true,
      data: {
        products: result.results,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
        meta: { query: q, engine: result.engine, responseTimeMs: result.responseTimeMs },
      },
    });
  } catch (err) {
    logger.error(`Semantic search error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Semantic search failed' } });
  }
};

exports.voiceSearch = async (req, res) => {
  try {
    const { transcript, page = 1, limit = 20 } = req.body;
    if (!transcript) {
      return res.status(400).json({ success: false, error: { message: 'Transcript is required' } });
    }

    const result = await searchEngine.voiceSearch(req.tenantId, transcript, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      userId: req.user?._id,
    });

    await searchTracker.trackSearch(req.tenantId, transcript, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
      resultCount: result.results?.length || 0,
      totalResults: result.total,
      searchType: 'voice',
      searchEngine: result.engine,
      responseTimeMs: result.responseTimeMs,
      hasResults: result.total > 0,
      metadata: { originalTranscript: transcript },
    });

    res.json({
      success: true,
      data: {
        products: result.results,
        transcript: transcript,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
        meta: { engine: result.engine, responseTimeMs: result.responseTimeMs },
      },
    });
  } catch (err) {
    logger.error(`Voice search error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Voice search failed' } });
  }
};

exports.imageSearch = async (req, res) => {
  try {
    const { imageUrl, page = 1, limit = 20 } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, error: { message: 'Image URL is required' } });
    }

    const result = await searchEngine.imageSearch(req.tenantId, imageUrl, {
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      userId: req.user?._id,
    });

    await searchTracker.trackSearch(req.tenantId, `[image:${imageUrl.substring(0, 50)}]`, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
      resultCount: result.results?.length || 0,
      totalResults: result.total,
      searchType: 'image',
      searchEngine: 'external',
      responseTimeMs: result.responseTimeMs || 0,
      hasResults: result.total > 0,
      metadata: { imageUrl },
    });

    res.json({
      success: true,
      data: {
        products: result.results || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total || 0,
        },
        meta: { imageUrl, message: result.message },
      },
    });
  } catch (err) {
    logger.error(`Image search error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Image search failed' } });
  }
};

exports.multiLanguageSearch = async (req, res) => {
  try {
    const { q, language, page = 1, limit = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: { message: 'Query is required' } });
    }

    const lang = language || req.searchOptimized?.language || 'en';

    const result = await searchEngine.multiLanguageSearch(req.tenantId, q, {
      language: lang,
      page: parseInt(page),
      limit: Math.min(parseInt(limit), 100),
      userId: req.user?._id,
    });

    await searchTracker.trackSearch(req.tenantId, q, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
      resultCount: result.results?.length || 0,
      totalResults: result.total,
      searchType: 'text',
      searchEngine: result.engine,
      responseTimeMs: result.responseTimeMs,
      language: lang,
      hasResults: result.total > 0,
      metadata: { detectedLanguage: lang },
    });

    res.json({
      success: true,
      data: {
        products: result.results,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrev: result.hasPrev,
        },
        meta: { query: q, language: lang, engine: result.engine, responseTimeMs: result.responseTimeMs },
      },
    });
  } catch (err) {
    logger.error(`Multi-language search error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Multi-language search failed' } });
  }
};

exports.trackClick = async (req, res) => {
  try {
    const { query, productId, position } = req.body;
    if (!query || !productId) {
      return res.status(400).json({ success: false, error: { message: 'Query and productId are required' } });
    }

    await searchTracker.trackClick(req.tenantId, query, productId, position || 0, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
    });

    res.json({ success: true, data: { message: 'Click tracked' } });
  } catch (err) {
    logger.error(`Click tracking error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to track click' } });
  }
};

exports.trackConversion = async (req, res) => {
  try {
    const { query, orderId, value } = req.body;
    if (!query || !orderId) {
      return res.status(400).json({ success: false, error: { message: 'Query and orderId are required' } });
    }

    await searchTracker.trackConversion(req.tenantId, query, orderId, value || 0, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
    });

    res.json({ success: true, data: { message: 'Conversion tracked' } });
  } catch (err) {
    logger.error(`Conversion tracking error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to track conversion' } });
  }
};

exports.trackBounce = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: { message: 'Query is required' } });
    }

    await searchTracker.trackBounce(req.tenantId, query, {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
    });

    res.json({ success: true, data: { message: 'Bounce tracked' } });
  } catch (err) {
    logger.error(`Bounce tracking error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to track bounce' } });
  }
};

exports.trackDwellTime = async (req, res) => {
  try {
    const { query, dwellTimeMs } = req.body;
    if (!query || !dwellTimeMs) {
      return res.status(400).json({ success: false, error: { message: 'Query and dwellTimeMs are required' } });
    }

    await searchTracker.trackDwellTime(req.tenantId, query, parseFloat(dwellTimeMs), {
      userId: req.user?._id,
      sessionId: req.headers['x-session-id'],
    });

    res.json({ success: true, data: { message: 'Dwell time tracked' } });
  } catch (err) {
    logger.error(`Dwell time tracking error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to track dwell time' } });
  }
};

exports.getSearchHistory = async (req, res) => {
  try {
    const { limit = 20, includeFilters = 'false' } = req.query;

    if (!req.user) {
      return res.json({ success: true, data: { history: [] } });
    }

    const history = await searchTracker.getUserSearchHistory(req.tenantId, req.user._id, {
      limit: parseInt(limit),
      includeFilters: includeFilters === 'true',
    });

    res.json({ success: true, data: { history } });
  } catch (err) {
    logger.error(`Search history error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch search history' } });
  }
};

exports.clearSearchHistory = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: 'Not authenticated' } });
    }

    await searchTracker.clearUserSearchHistory(req.tenantId, req.user._id);
    res.json({ success: true, data: { message: 'Search history cleared' } });
  } catch (err) {
    logger.error(`Clear search history error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to clear search history' } });
  }
};

exports.getSearchAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const analytics = await searchTracker.getSearchAnalytics(req.tenantId, {
      startDate,
      endDate,
      groupBy,
    });

    const popularSearches = await searchTracker.getPopularSearches(req.tenantId, { limit: 20 });
    const zeroResultQueries = await searchTracker.getZeroResultQueries(req.tenantId, { limit: 20 });

    res.json({
      success: true,
      data: {
        analytics,
        popularSearches,
        zeroResultQueries,
        summary: analytics.length > 0 ? analytics.reduce((acc, day) => ({
          totalSearches: acc.totalSearches + day.totalSearches,
          totalClicks: acc.totalClicks + day.totalClicks,
          totalConversions: acc.totalConversions + day.totalConversions,
          avgResponseTime: (acc.avgResponseTime + day.avgResponseTime) / 2,
          avgClickThroughRate: (acc.avgClickThroughRate + day.clickThroughRate) / 2,
        }), { totalSearches: 0, totalClicks: 0, totalConversions: 0, avgResponseTime: 0, avgClickThroughRate: 0 }) : null,
      },
    });
  } catch (err) {
    logger.error(`Search analytics error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to fetch search analytics' } });
  }
};

exports.reindex = async (req, res) => {
  try {
    const result = await searchIndexer.reindexAll(req.tenantId);
    res.json({
      success: true,
      data: {
        message: 'Search index rebuilt',
        indexed: result,
      },
    });
  } catch (err) {
    logger.error(`Reindex error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Reindex failed' } });
  }
};

exports.createSearchIndex = async (req, res) => {
  try {
    const Product = require('../models/Product');
    await Product.syncIndexes();
    res.json({ success: true, data: { message: 'Search indexes synchronized' } });
  } catch (err) {
    logger.error(`Index creation error: ${err.message}`);
    res.status(500).json({ success: false, error: { message: 'Failed to create search indexes' } });
  }
};
