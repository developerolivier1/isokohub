const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const logger = require('../utils/logger');
const searchElasticsearch = require('./searchElasticsearch');
const { isElasticsearchConnected, connectElasticsearch } = require('../config/elasticsearch');

const SEARCH_MODES = {
  ELASTICSEARCH: 'elasticsearch',
  ATLAS_SEARCH: 'atlas_search',
  TEXT_INDEX: 'text_index',
  REGEX_FALLBACK: 'regex_fallback',
};

const SUPPORTED_LANGUAGES = ['en', 'rw', 'fr', 'sw', 'ar', 'es', 'pt', 'zh', 'ja', 'ko'];

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\sÀ-ÿñÑ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNGrams(text, min = 2, max = 5) {
  const words = normalizeText(text).split(/\s+/);
  const ngrams = new Set();
  for (const word of words) {
    if (word.length < min) continue;
    for (let i = min; i <= Math.min(max, word.length); i++) {
      for (let j = 0; j <= word.length - i; j++) {
        ngrams.add(word.substring(j, j + i));
      }
    }
  }
  return [...ngrams];
}

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1,
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function fuzzyMatch(query, text, _threshold = 0.75) {
  const q = normalizeText(query);
  const t = normalizeText(text);
  if (t.includes(q)) return 1;
  const queryWords = q.split(/\s+/);
  const textWords = t.split(/\s+/);
  let totalScore = 0;
  let matchedWords = 0;
  for (const qw of queryWords) {
    let bestScore = 0;
    for (const tw of textWords) {
      if (tw === qw) { bestScore = 1; break; }
      if (tw.startsWith(qw) || qw.startsWith(tw)) { bestScore = Math.max(bestScore, 0.9); continue; }
      const dist = levenshteinDistance(qw, tw);
      const maxLen = Math.max(qw.length, tw.length);
      const sim = maxLen > 0 ? 1 - dist / maxLen : 0;
      bestScore = Math.max(bestScore, sim);
    }
    totalScore += bestScore;
    if (bestScore > 0.5) matchedWords++;
  }
  const avgScore = queryWords.length > 0 ? totalScore / queryWords.length : 0;
  const wordMatchRatio = queryWords.length > 0 ? matchedWords / queryWords.length : 0;
  return avgScore * 0.6 + wordMatchRatio * 0.4;
}

function detectSearchMode() {
  const uri = process.env.MONGODB_URI || '';
  if (uri.includes('mongodb+srv') || uri.includes('atlas')) {
    return SEARCH_MODES.ATLAS_SEARCH;
  }
  return SEARCH_MODES.TEXT_INDEX;
}

async function buildRankingPipeline(tenantId, query, options = {}) {
  const { userId, category, vendor } = options;
  const pipeline = [];
  const now = new Date();

  pipeline.push({
    $lookup: {
      from: 'orders',
      let: { productId: '$_id' },
      pipeline: [
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: 'delivered' } },
        { $unwind: '$items' },
        { $match: { $expr: { $eq: ['$items.productId', '$$productId'] } } },
        { $group: { _id: null, totalSold: { $sum: '$items.quantity' }, revenue: { $sum: '$items.total' } } },
      ],
      as: 'orderStats',
    },
  });

  pipeline.push({
    $addFields: {
      totalSold: { $ifNull: [{ $arrayElemAt: ['$orderStats.totalSold', 0] }, 0] },
      revenue: { $ifNull: [{ $arrayElemAt: ['$orderStats.revenue', 0] }, 0] },
      conversionScore: {
        $cond: {
          if: { $gt: ['$ratings.count', 0] },
          then: { $multiply: ['$ratings.average', { $log: { $add: ['$ratings.count', 1] } }] },
          else: 0,
        },
      },
      recencyScore: {
        $cond: {
          if: { $ifNull: ['$createdAt', false] },
          then: { $divide: [1, { $add: [1, { $divide: [{ $subtract: [now, '$createdAt'] }, 3600000] }] }] },
          else: 0,
        },
      },
    },
  });

  pipeline.push({
    $lookup: {
      from: 'vendors',
      localField: 'vendorId',
      foreignField: '_id',
      as: 'vendorData',
    },
  });

  pipeline.push({
    $addFields: {
      vendorRating: { $ifNull: [{ $arrayElemAt: ['$vendorData.ratings.average', 0] }, 0] },
      vendorTotalSales: { $ifNull: [{ $arrayElemAt: ['$vendorData.totalSales', 0] }, 0] },
      vendorIsFeatured: { $ifNull: [{ $arrayElemAt: ['$vendorData.isFeatured', 0] }, false] },
    },
  });

  pipeline.push({
    $lookup: {
      from: 'inventories',
      let: { productId: '$_id' },
      pipeline: [
        { $match: { $expr: { $eq: ['$productId', '$$productId'] }, quantity: { $gt: 0 } } },
        { $count: 'stockedWarehouses' },
      ],
      as: 'inventoryData',
    },
  });

  pipeline.push({
    $addFields: {
      inStock: { $gt: [{ $ifNull: [{ $arrayElemAt: ['$inventoryData.stockedWarehouses', 0] }, 0] }, 0] },
      inventoryScore: {
        $cond: {
          if: { $gt: [{ $ifNull: [{ $arrayElemAt: ['$inventoryData.stockedWarehouses', 0] }, 0] }, 0] },
          then: 1,
          else: 0.1,
        },
      },
    },
  });

  pipeline.push({
    $lookup: {
      from: 'advertisements',
      let: { productId: '$_id', vendorId: '$vendorId' },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ['$tenantId', new mongoose.Types.ObjectId(tenantId)] },
                { $eq: ['$status', 'active'] },
                { $eq: ['$isActive', true] },
                { $eq: ['$placement', 'search_results'] },
                { $or: [{ $eq: ['$targetProductId', '$$productId'] }, { $eq: ['$vendorId', '$$vendorId'] }] },
                { $lte: ['$schedule.startDate', now] },
                { $gte: ['$schedule.endDate', now] },
              ],
            },
          },
        },
        { $sort: { 'metrics.ctr': -1 } },
        { $limit: 1 },
        { $project: { bidAmount: 1, 'metrics.ctr': 1, dailyBudget: 1, spent: 1 } },
      ],
      as: 'sponsoredData',
    },
  });

  pipeline.push({
    $addFields: {
      sponsoredScore: {
        $cond: {
          if: { $gt: [{ $size: '$sponsoredData' }, 0] },
          then: {
            $multiply: [
              0.5,
              { $divide: [{ $ifNull: [{ $arrayElemAt: ['$sponsoredData.bidAmount', 0] }, 0] }, 1000] },
            ],
          },
          else: 0,
        },
      },
    },
  });

  if (userId) {
    pipeline.push({
      $lookup: {
        from: 'orders',
        let: { productId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$tenantId', new mongoose.Types.ObjectId(tenantId)] },
                ],
              },
            },
          },
          { $unwind: '$items' },
          { $match: { $expr: { $eq: ['$items.productId', '$$productId'] } } },
          { $count: 'purchased' },
        ],
        as: 'userPurchaseData',
      },
    });

    pipeline.push({
      $lookup: {
        from: 'searchhistories',
        let: {},
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$userId', new mongoose.Types.ObjectId(userId)] },
                  { $eq: ['$tenantId', new mongoose.Types.ObjectId(tenantId)] },
                ],
              },
            },
          },
          { $sort: { createdAt: -1 } },
          { $limit: 50 },
          { $group: { _id: null, categories: { $addToSet: '$filters.category' } } },
        ],
        as: 'userSearchData',
      },
    });

    pipeline.push({
      $addFields: {
        personalizationScore: {
          $add: [
            { $cond: [{ $gt: [{ $ifNull: [{ $arrayElemAt: ['$userPurchaseData.purchased', 0] }, 0] }, 0] }, 3, 0] },
          ],
        },
      },
    });
  }

  pipeline.push({
    $addFields: {
      popularityScore: {
        $add: [
          { $multiply: [{ $ifNull: ['$totalSold', 0] }, 0.01] },
          { $multiply: ['$conversionScore', 0.1] },
          { $multiply: ['$recencyScore', 0.5] },
        ],
      },
      vendorScore: {
        $add: [
          { $multiply: ['$vendorRating', 0.2] },
          { $cond: ['$vendorIsFeatured', 0.5, 0] },
          { $multiply: [{ $log: { $add: ['$vendorTotalSales', 1] } }, 0.01] },
        ],
      },
    },
  });

  return pipeline;
}

class SearchEngine {
  constructor() {
    this.mode = detectSearchMode();
    this.esAvailable = false;
    this.initElasticsearch();
    logger.info(`Search engine initialized in ${this.mode} mode`);
  }

  async initElasticsearch() {
    try {
      await connectElasticsearch();
      if (isElasticsearchConnected()) {
        await searchElasticsearch.initialize();
        this.esAvailable = true;
        logger.info('Elasticsearch search mode available');
      }
    } catch (err) {
      this.esAvailable = false;
      logger.warn(`Elasticsearch initialization failed: ${err.message}`);
    }
  }

  async search(tenantId, query, options = {}) {
    const startTime = Date.now();
    const {
      category, minPrice, maxPrice, vendor, tags,
      sort = 'relevance', page = 1, limit = 20,
      userId, language = 'en', fuzzy = true,
      inStock, featured, searchType = 'text',
    } = options;

    const skip = (page - 1) * limit;
    const normalized = normalizeText(query);

    if (!normalized && !category && !vendor) {
      return { results: [], total: 0, page, limit, totalPages: 0, engine: this.mode };
    }

    let results = [];
    let total = 0;
    let engine = this.mode;

    if (this.esAvailable && normalized) {
      try {
        const result = await searchElasticsearch.search(tenantId, normalized, options);
        if (result.engine !== 'elasticsearch_error') {
          results = result.results;
          total = result.total;
          engine = SEARCH_MODES.ELASTICSEARCH;
        } else {
          throw new Error(result.engine);
        }
      } catch (err) {
        logger.warn(`Elasticsearch search failed, falling back to MongoDB: ${err.message}`);
        this.esAvailable = false;
      }
    }

    if (!this.esAvailable && this.mode === SEARCH_MODES.ATLAS_SEARCH && normalized) {
      try {
        const result = await this.atlasSearch(tenantId, normalized, options);
        results = result.results;
        total = result.total;
        engine = SEARCH_MODES.ATLAS_SEARCH;
      } catch (err) {
        logger.warn(`Atlas Search failed, falling back to text index: ${err.message}`);
        const result = await this.textIndexSearch(tenantId, normalized, options);
        results = result.results;
        total = result.total;
        engine = SEARCH_MODES.TEXT_INDEX;
      }
    } else if (!this.esAvailable && normalized) {
      const result = await this.textIndexSearch(tenantId, normalized, options);
      results = result.results;
      total = result.total;
      engine = SEARCH_MODES.TEXT_INDEX;
    }

    if (!normalized && (category || vendor)) {
      const result = await this.filterOnlySearch(tenantId, options);
      results = result.results;
      total = result.total;
      engine = SEARCH_MODES.REGEX_FALLBACK;
    }

    if (fuzzy && results.length === 0 && normalized) {
      const result = await this.fuzzySearch(tenantId, normalized, options);
      results = result.results;
      total = result.total;
      engine = SEARCH_MODES.REGEX_FALLBACK;
    }

    if (sort === 'relevance' && results.length > 0) {
      results = this.applyRanking(results, query, options);
    }

    const totalPages = Math.ceil(total / limit);
    const responseTimeMs = Date.now() - startTime;

    return {
      results: results.slice(skip, skip + limit),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      engine,
      responseTimeMs,
      query: normalized,
    };
  }

  async atlasSearch(tenantId, query, options) {
    const { category, minPrice, maxPrice, vendor, limit = 20, language = 'en' } = options;
    const pipeline = [];

    const searchStage = {
      $search: {
        index: 'product_search',
        compound: {
          should: [
            {
              text: { query, path: 'name', score: { boost: { value: 10 } }, fuzzy: { maxEdits: 2, prefixLength: 2 } },
            },
            {
              text: { query, path: 'brand', score: { boost: { value: 5 } }, fuzzy: { maxEdits: 1 } },
            },
            {
              text: { query, path: 'tags', score: { boost: { value: 3 } }, fuzzy: { maxEdits: 1 } },
            },
            {
              text: { query, path: 'description', score: { boost: { value: 1 } }, fuzzy: { maxEdits: 1 } },
            },
            {
              text: { query, path: 'shortDescription', score: { boost: { value: 1 } } },
            },
          ],
          minimumShouldMatch: 1,
        },
      },
    };

    if (SUPPORTED_LANGUAGES.includes(language) && language !== 'en') {
      searchStage.$search.compound.should.forEach(stage => {
        if (stage.text) stage.text.query = query;
      });
    }

    pipeline.push(searchStage);

    const matchStage = { tenantId: new mongoose.Types.ObjectId(tenantId), status: 'active' };
    if (category) matchStage.category = new mongoose.Types.ObjectId(category);
    if (vendor) matchStage.vendorId = new mongoose.Types.ObjectId(vendor);
    if (options.featured) matchStage.featured = true;

    pipeline.push({ $match: matchStage });

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseFloat(minPrice);
      if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
      pipeline.push({ $match: { price: priceFilter } });
    }

    if (options.inStock) {
      pipeline.push({
        $lookup: {
          from: 'inventories',
          let: { pid: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$productId', '$$pid'] }, quantity: { $gt: 0 } } },
            { $limit: 1 },
          ],
          as: 'stockInfo',
        },
      });
      pipeline.push({ $match: { 'stockInfo.0': { $exists: true } } });
      pipeline.push({ $project: { stockInfo: 0 } });
    }

    const rankingPipe = await buildRankingPipeline(tenantId, query, options);
    pipeline.push(...rankingPipe);

    pipeline.push({
      $addFields: {
        totalScore: {
          $add: [
            { $ifNull: ['$score', 0] },
            { $multiply: [{ $ifNull: ['$popularityScore', 0] }, 0.3] },
            { $multiply: [{ $ifNull: ['$vendorScore', 0] }, 0.2] },
            { $multiply: [{ $ifNull: ['$sponsoredScore', 0] }, 0.4] },
            { $multiply: [{ $ifNull: ['$inventoryScore', 0] }, 0.1] },
            { $ifNull: ['$personalizationScore', 0] },
          ],
        },
      },
    });

    pipeline.push({ $sort: { totalScore: -1, totalSold: -1, 'ratings.average': -1 } });

    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    pipeline.push({ $skip: ((options.page || 1) - 1) * limit }, { $limit: limit });

    const [results, countResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline),
    ]);

    return {
      results,
      total: countResult[0]?.total || 0,
    };
  }

  async textIndexSearch(tenantId, query, options) {
    const { category, minPrice, maxPrice, vendor, limit = 20, sort: sortOption } = options;
    const searchQuery = { tenantId, status: 'active' };

    if (category) searchQuery.category = new mongoose.Types.ObjectId(category);
    if (vendor) searchQuery.vendorId = new mongoose.Types.ObjectId(vendor);
    if (options.featured) searchQuery.featured = true;

    if (minPrice || maxPrice) {
      searchQuery.price = {};
      if (minPrice) searchQuery.price.$gte = parseFloat(minPrice);
      if (maxPrice) searchQuery.price.$lte = parseFloat(maxPrice);
    }

    const pipeline = [];

    if (query) {
      pipeline.push({
        $match: {
          ...searchQuery,
          $text: { $search: query },
        },
      });
      pipeline.push({
        $addFields: {
          textScore: { $meta: 'textScore' },
        },
      });
    } else {
      pipeline.push({ $match: searchQuery });
    }

    const rankingPipe = await buildRankingPipeline(tenantId, query, options);
    pipeline.push(...rankingPipe);

    pipeline.push({
      $addFields: {
        totalScore: {
          $add: [
            { $multiply: [{ $ifNull: ['$textScore', 0] }, 2] },
            { $multiply: [{ $ifNull: ['$popularityScore', 0] }, 0.3] },
            { $multiply: [{ $ifNull: ['$vendorScore', 0] }, 0.2] },
            { $multiply: [{ $ifNull: ['$sponsoredScore', 0] }, 0.4] },
            { $multiply: [{ $ifNull: ['$inventoryScore', 0] }, 0.1] },
            { $ifNull: ['$personalizationScore', 0] },
          ],
        },
      },
    });

    if (sortOption === 'price_asc') pipeline.push({ $sort: { price: 1 } });
    else if (sortOption === 'price_desc') pipeline.push({ $sort: { price: -1 } });
    else if (sortOption === 'rating') pipeline.push({ $sort: { 'ratings.average': -1, 'ratings.count': -1 } });
    else if (sortOption === 'newest') pipeline.push({ $sort: { createdAt: -1 } });
    else if (sortOption === 'bestseller') pipeline.push({ $sort: { totalSold: -1, 'ratings.average': -1 } });
    else pipeline.push({ $sort: { totalScore: -1, totalSold: -1, 'ratings.average': -1 } });

    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });
    pipeline.push({ $skip: ((options.page || 1) - 1) * limit }, { $limit: limit });

    const [results, countResult] = await Promise.all([
      Product.aggregate(pipeline),
      Product.aggregate(countPipeline),
    ]);

    return {
      results,
      total: countResult[0]?.total || 0,
    };
  }

  async fuzzySearch(tenantId, query, options) {
    const { limit = 20, page = 1, category } = options;
    const skip = (page - 1) * limit;
    const normalized = normalizeText(query);

    const searchFilter = { tenantId: new mongoose.Types.ObjectId(tenantId), status: 'active' };
    if (category) searchFilter.category = new mongoose.Types.ObjectId(category);

    let products = await Product.find(searchFilter)
      .select('name description brand tags price images ratings totalSold slug')
      .limit(200)
      .lean();

    const scored = products.map(p => {
      const nameScore = fuzzyMatch(normalized, p.name);
      const brandScore = p.brand ? fuzzyMatch(normalized, p.brand) * 0.8 : 0;
      const descScore = p.description ? fuzzyMatch(normalized, p.description) * 0.3 : 0;
      const tagsScore = p.tags?.length
        ? Math.max(...p.tags.map(t => fuzzyMatch(normalized, t) * 0.6), 0)
        : 0;
      const maxScore = Math.max(nameScore, brandScore, tagsScore, descScore);
      return { ...p, score: maxScore, fuzzyScore: maxScore };
    })
      .filter(p => p.score > 0.4)
      .sort((a, b) => b.score - a.score);

    const total = scored.length;
    const results = scored.slice(skip, skip + limit);

    return { results, total };
  }

  async filterOnlySearch(tenantId, options) {
    const { category, vendor, minPrice, maxPrice, limit = 20, page = 1 } = options;
    const skip = (page - 1) * limit;
    const filter = { tenantId: new mongoose.Types.ObjectId(tenantId), status: 'active' };

    if (category) filter.category = new mongoose.Types.ObjectId(category);
    if (vendor) filter.vendorId = new mongoose.Types.ObjectId(vendor);
    if (options.featured) filter.featured = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const [results, total] = await Promise.all([
      Product.find(filter)
        .sort({ totalSold: -1, 'ratings.average': -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);

    return { results, total };
  }

  async autocomplete(tenantId, query, options = {}) {
    const { limit = 10, userId, language = 'en' } = options;
    const normalized = normalizeText(query);

    if (!normalized || normalized.length < 2) {
      return { suggestions: [], products: [], brands: [], categories: [] };
    }

    const escapedQuery = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let productSuggestions = [];
    let brandSuggestions = [];
    let categorySuggestions = [];

    if (this.esAvailable) {
      try {
        const esResult = await searchElasticsearch.autocomplete(tenantId, normalized, { limit });
        if (esResult.suggestions.length > 0) {
          return esResult;
        }
      } catch { }
    }

    if (this.mode === SEARCH_MODES.ATLAS_SEARCH) {
      try {
        const [products, brands, categories] = await Promise.all([
          Product.aggregate([
            {
              $search: {
                index: 'product_search',
                compound: {
                  should: [
                    { autocomplete: { query: normalized, path: 'name', fuzzy: { maxEdits: 1 } } },
                    { autocomplete: { query: normalized, path: 'brand', fuzzy: { maxEdits: 1 } } },
                    { autocomplete: { query: normalized, path: 'tags', fuzzy: { maxEdits: 1 } } },
                  ],
                },
              },
            },
            { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: 'active' } },
            { $limit: 8 },
            { $project: { name: 1, brand: 1, slug: 1, images: { $slice: ['$images', 1] }, price: 1, ratings: 1 } },
          ]),
          Product.distinct('brand', {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            brand: { $regex: `^${escapedQuery}`, $options: 'i' },
            status: 'active',
          }),
          Category.find({
            tenantId: new mongoose.Types.ObjectId(tenantId),
            name: { $regex: `^${escapedQuery}`, $options: 'i' },
            isActive: true,
          }).select('name slug').limit(5).lean(),
        ]);
        productSuggestions = products;
        brandSuggestions = brands.slice(0, 5);
        categorySuggestions = categories;
      } catch {
        await this.fallbackAutocomplete(tenantId, normalized, escapedQuery, { limit });
      }
    } else {
      const result = await this.fallbackAutocomplete(tenantId, normalized, escapedQuery, { limit });
      productSuggestions = result.products;
      brandSuggestions = result.brands;
      categorySuggestions = result.categories;
    }

    const ngramSuggestions = buildNGrams(normalized).map(ng => ({
      text: ng,
      type: 'ngram',
      score: ng.length / normalized.length,
    })).filter(s => s.text !== normalized).slice(0, 3);

    const querySuggestions = productSuggestions.map(p => ({
      text: p.name,
      type: 'product',
      id: p._id,
      slug: p.slug,
      image: p.images?.[0]?.url,
      price: p.price,
      brand: p.brand,
    }));

    const brandItems = brandSuggestions.map(b => ({
      text: b,
      type: 'brand',
    }));

    const categoryItems = categorySuggestions.map(c => ({
      text: c.name,
      type: 'category',
      slug: c.slug,
    }));

    return {
      suggestions: [...querySuggestions, ...brandItems, ...categoryItems, ...ngramSuggestions],
      products: productSuggestions,
      brands: brandSuggestions,
      categories: categorySuggestions,
    };
  }

  async fallbackAutocomplete(tenantId, normalized, escapedQuery, { limit = 10 } = {}) {
    const [products, brands, categories] = await Promise.all([
      Product.find({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        name: { $regex: `^${escapedQuery}`, $options: 'i' },
        status: 'active',
      })
        .select('name brand slug images price ratings')
        .sort({ totalSold: -1 })
        .limit(8)
        .lean(),
      Product.distinct('brand', {
        tenantId: new mongoose.Types.ObjectId(tenantId),
        brand: { $regex: `^${escapedQuery}`, $options: 'i' },
        status: 'active',
      }),
      Category.find({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        name: { $regex: `^${escapedQuery}`, $options: 'i' },
        isActive: true,
      }).select('name slug').limit(5).lean(),
    ]);

    if (products.length < 8) {
      const fuzzyProducts = await Product.find({
        tenantId: new mongoose.Types.ObjectId(tenantId),
        name: { $regex: escapedQuery.split('').join('.*'), $options: 'i' },
        status: 'active',
        _id: { $nin: products.map(p => p._id) },
      })
        .select('name brand slug images price ratings')
        .sort({ totalSold: -1 })
        .limit(8 - products.length)
        .lean();
      products.push(...fuzzyProducts);
    }

    return { products, brands: brands.slice(0, 5), categories };
  }

  async barcodeSearch(tenantId, barcode) {
    if (this.esAvailable) {
      try {
        const esProduct = await searchElasticsearch.barcodeSearch(tenantId, barcode);
        if (esProduct) return esProduct;
      } catch { }
    }

    const product = await Product.findOne({
      tenantId: new mongoose.Types.ObjectId(tenantId),
      barcode,
      status: 'active',
    }).populate('vendorId', 'storeName storeLogo ratings');

    return product;
  }

  async semanticSearch(tenantId, query, options = {}) {
    const aiEndpoint = process.env.AI_MODEL_ENDPOINT;
    const apiKey = process.env.AI_API_KEY;

    if (aiEndpoint && apiKey) {
      try {
        const axios = require('axios');
        const response = await axios.post(`${aiEndpoint}/search/embed`, {
          query,
          tenantId: tenantId.toString(),
          ...options,
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          timeout: 5000,
        });
        if (response.data?.results) {
          return response.data;
        }
      } catch (err) {
        logger.warn(`Semantic search endpoint unavailable, falling back: ${err.message}`);
      }
    }

    const expandedQuery = query
      .replace(/\b(laptop|computer|notebook)\b/gi, 'laptop computer notebook')
      .replace(/\b(phone|smartphone|mobile|cell)\b/gi, 'phone smartphone mobile cell')
      .replace(/\b(shoes|sneakers|footwear)\b/gi, 'shoes sneakers footwear')
      .replace(/\b(dress|gown|outfit)\b/gi, 'dress gown outfit')
      .replace(/\b(watch|wristwatch)\b/gi, 'watch wristwatch')
      .replace(/\b(bag|backpack|handbag)\b/gi, 'bag backpack handbag');

    return this.search(tenantId, expandedQuery, options);
  }

  async voiceSearch(tenantId, transcript, options = {}) {
    const cleaned = transcript
      .replace(/\b(i want|i need|find me|show me|search for|looking for|get me)\b/gi, '')
      .replace(/\b(please|thanks|thank you)\b/gi, '')
      .trim();

    if (!cleaned) return this.search(tenantId, transcript, options);

    return this.search(tenantId, cleaned, { ...options, searchType: 'voice' });
  }

  async imageSearch(tenantId, imageUrl, options = {}) {
    const aiEndpoint = process.env.AI_MODEL_ENDPOINT;
    const apiKey = process.env.AI_API_KEY;

    if (aiEndpoint && apiKey) {
      try {
        const axios = require('axios');
        const response = await axios.post(`${aiEndpoint}/search/image`, {
          imageUrl,
          tenantId: tenantId.toString(),
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 10000,
        });
        if (response.data?.tags?.length) {
          return this.search(tenantId, response.data.tags.join(' '), options);
        }
        if (response.data?.embedding) {
          return this.searchByEmbedding(tenantId, response.data.embedding, options);
        }
      } catch (err) {
        logger.warn(`Image search endpoint unavailable: ${err.message}`);
      }
    }

    return {
      results: [],
      total: 0,
      message: 'Image search requires AI_MODEL_ENDPOINT configuration',
    };
  }

  async searchByEmbedding(tenantId, embedding, options = {}) {
    const { page = 1, limit = 20 } = options;
    if (!embedding || !Array.isArray(embedding)) {
      return { results: [], total: 0 };
    }
    const skip = (page - 1) * limit;

    const results = await Product.aggregate([
      { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: 'active' } },
      {
        $addFields: {
          vectorScore: { $meta: 'vectorSearchScore' },
        },
      },
      { $sort: { vectorScore: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    return { results, total: results.length, page, limit };
  }

  async multiLanguageSearch(tenantId, query, options = {}) {
    const { language = 'en' } = options;

    const translationMap = {
      rw: {
        ikinyarwa: 'price',
        igiciro: 'price',
        ibicuruzwa: 'products',
        ibiribwa: 'food',
        imyenda: 'clothing',
      },
      fr: {
        prix: 'price',
        produits: 'products',
        vêtements: 'clothing',
        nourriture: 'food',
      },
      sw: {
        bei: 'price',
        bidhaa: 'products',
        nguo: 'clothing',
        chakula: 'food',
      },
    };

    const translations = translationMap[language] || {};
    let translatedQuery = query;
    for (const [langWord, enWord] of Object.entries(translations)) {
      translatedQuery = translatedQuery.replace(new RegExp(langWord, 'gi'), enWord);
    }

    if (translatedQuery !== query) {
      logger.info(`Translated query: "${query}" -> "${translatedQuery}" (${language})`);
    }

    return this.search(tenantId, translatedQuery, options);
  }

  async getTrendingSearches(tenantId, { limit = 20, period = 'daily' } = {}) {
    const TrendingSearch = require('../models/TrendingSearch');
    return TrendingSearch.getTrending(tenantId, { limit, period });
  }

  async getSearchSuggestions(tenantId, query, options = {}) {
    return this.autocomplete(tenantId, query, options);
  }

  async indexProduct(product) {
    const TrendingSearch = require('../models/TrendingSearch');
    try {
      const ngrams = buildNGrams(product.name);
      for (const ngram of ngrams) {
        await TrendingSearch.findOneAndUpdate(
          { tenantId: product.tenantId, normalizedQuery: ngram.toLowerCase(), period: 'daily' },
          { $setOnInsert: { query: ngram, period: 'daily', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) } },
          { upsert: true },
        );
      }

      if (this.esAvailable) {
        await searchElasticsearch.indexDocument(product).catch(err => {
          logger.warn(`Elasticsearch product index failed: ${err.message}`);
        });
      }
    } catch (err) {
      logger.error(`Product indexing failed: ${err.message}`);
    }
  }

  applyRanking(results, query, options) {
    const { userId } = options;
    const normalized = normalizeText(query);

    return results.map(item => {
      const nameScore = normalized ? fuzzyMatch(normalized, item.name || '') : 0;
      const brandScore = normalized && item.brand ? fuzzyMatch(normalized, item.brand) * 0.8 : 0;
      const descScore = normalized && item.description ? fuzzyMatch(normalized, item.description) * 0.4 : 0;
      const tagScore = normalized && item.tags?.length
        ? Math.max(...item.tags.map(t => fuzzyMatch(normalized, t) * 0.6), 0)
        : 0;

      return {
        ...item,
        _rankingScore: {
          relevance: Math.max(nameScore, brandScore, tagScore, descScore),
          popularity: item.popularityScore || 0,
          vendor: item.vendorScore || 0,
          sponsored: item.sponsoredScore || 0,
          inventory: item.inventoryScore || 0.1,
          personalization: item.personalizationScore || 0,
        },
      };
    }).sort((a, b) => {
      const sa = a._rankingScore;
      const sb = b._rankingScore;
      const scoreA = sa.relevance * 3 + sa.popularity * 0.3 + sa.vendor * 0.2 + sa.sponsored * 0.4 + sa.inventory * 0.1 + (sa.personalization || 0);
      const scoreB = sb.relevance * 3 + sb.popularity * 0.3 + sb.vendor * 0.2 + sb.sponsored * 0.4 + sb.inventory * 0.1 + (sb.personalization || 0);
      return scoreB - scoreA;
    });
  }
}

module.exports = new SearchEngine();
