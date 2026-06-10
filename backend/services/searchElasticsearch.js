const { getClient, isElasticsearchConnected, ensureIndex, getIndexMapping } = require('../config/elasticsearch');
const logger = require('../utils/logger');

const SUPPORTED_LANGUAGES = ['en', 'rw', 'fr', 'sw', 'ar', 'es', 'pt', 'zh', 'ja', 'ko'];

function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\sÀ-ÿñÑ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

class SearchElasticsearch {
  constructor() {
    this.indexPrefix = process.env.SEARCH_INDEX_PREFIX || 'isokohub_';
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    if (!isElasticsearchConnected()) {
      logger.warn('Elasticsearch not connected, skipping ES search mode initialization');
      return;
    }
    try {
      const mapping = await getIndexMapping();
      await ensureIndex(`${this.indexPrefix}products`, mapping);
      this.initialized = true;
      logger.info('Elasticsearch search mode initialized');
    } catch (err) {
      logger.error(`Elasticsearch initialization error: ${err.message}`);
    }
  }

  async search(tenantId, query, options = {}) {
    if (!isElasticsearchConnected()) {
      return { results: [], total: 0, engine: 'elasticsearch_unavailable' };
    }

    const startTime = Date.now();
    const {
      category, minPrice, maxPrice, vendor, tags,
      sort = 'relevance', page = 1, limit = 20,
      userId, language = 'en', fuzzy = true,
      inStock, featured,
    } = options;

    const skip = (page - 1) * limit;
    const normalized = normalizeText(query);

    if (!normalized && !category && !vendor) {
      return { results: [], total: 0, page, limit, totalPages: 0, engine: 'elasticsearch' };
    }

    try {
      const must = [];
      const filter = [];

      must.push({ term: { tenantId } });
      must.push({ term: { status: 'active' } });

      if (normalized) {
        if (fuzzy) {
          must.push({
            multi_match: {
              query: normalized,
              fields: ['name^10', 'brand^5', 'tags^3', 'description', 'shortDescription'],
              type: 'best_fields',
              fuzziness: 'AUTO',
              prefix_length: 2,
              minimum_should_match: '75%',
            },
          });
        } else {
          must.push({
            multi_match: {
              query: normalized,
              fields: ['name^10', 'brand^5', 'tags^3', 'description', 'shortDescription'],
              type: 'best_fields',
            },
          });
        }
      }

      if (category) filter.push({ term: { category } });
      if (vendor) filter.push({ term: { vendorId: vendor } });
      if (featured) filter.push({ term: { featured: true } });
      if (inStock) filter.push({ term: { inStock: true } });
      if (tags) filter.push({ terms: { tags: Array.isArray(tags) ? tags : [tags] } });

      if (minPrice || maxPrice) {
        const range = {};
        if (minPrice) range.gte = parseFloat(minPrice);
        if (maxPrice) range.lte = parseFloat(maxPrice);
        filter.push({ range: { price: range } });
      }

      let sortArr;
      switch (sort) {
        case 'price_asc': sortArr = [{ price: { order: 'asc' } }]; break;
        case 'price_desc': sortArr = [{ price: { order: 'desc' } }]; break;
        case 'rating': sortArr = [{ ratingsAverage: { order: 'desc' } }, { ratingsCount: { order: 'desc' } }]; break;
        case 'newest': sortArr = [{ createdAt: { order: 'desc' } }]; break;
        case 'bestseller': sortArr = [{ totalSold: { order: 'desc' } }]; break;
        default:
          sortArr = [
            { _score: { order: 'desc' } },
            { totalSold: { order: 'desc' } },
            { ratingsAverage: { order: 'desc' } },
          ];
      }

      const body = {
        query: {
          bool: {
            must: must.length > 1 ? must : must,
            filter: filter.length > 0 ? filter : undefined,
          },
        },
        sort: sortArr,
        from: skip,
        size: limit,
        _source: {
          excludes: ['description'],
        },
      };

      const client = getClient();
      const response = await client.search({
        index: `${this.indexPrefix}products`,
        body,
      });

      const total = typeof response.hits.total === 'object'
        ? response.hits.total.value
        : response.hits.total || 0;

      const results = response.hits.hits.map(hit => ({
        _id: hit._id,
        _score: hit._score,
        ...hit._source,
        _rankingScore: {
          relevance: hit._score || 0,
          popularity: hit._source?.totalSold || 0,
          vendor: hit._source?.vendorRating || 0,
          inventory: hit._source?.inStock ? 1 : 0.1,
          sponsored: 0,
          personalization: 0,
        },
      }));

      const totalPages = Math.ceil(total / limit);
      const responseTimeMs = Date.now() - startTime;

      return {
        results,
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
        engine: 'elasticsearch',
        responseTimeMs,
        query: normalized,
      };
    } catch (err) {
      logger.error(`Elasticsearch search error: ${err.message}`);
      return { results: [], total: 0, page, limit, totalPages: 0, engine: 'elasticsearch_error' };
    }
  }

  async autocomplete(tenantId, query, options = {}) {
    if (!isElasticsearchConnected()) {
      return { suggestions: [], products: [], brands: [], categories: [] };
    }

    const { limit = 10 } = options;
    const normalized = normalizeText(query);

    if (!normalized || normalized.length < 2) {
      return { suggestions: [], products: [], brands: [], categories: [] };
    }

    try {
      const client = getClient();

      const response = await client.search({
        index: `${this.indexPrefix}products`,
        body: {
          query: {
            bool: {
              must: [
                { term: { tenantId } },
                { term: { status: 'active' } },
                {
                  multi_match: {
                    query: normalized,
                    fields: ['name.suggest^10', 'brand^5', 'tags^3'],
                    type: 'bool_prefix',
                  },
                },
              ],
            },
          },
          size: limit,
          _source: ['name', 'brand', 'slug', 'price', 'images', 'ratingsAverage', 'tags'],
          suggest: {
            product_suggestions: {
              prefix: normalized,
              completion: {
                field: 'name.suggest',
                size: 5,
                fuzzy: { fuzziness: 'AUTO' },
              },
            },
          },
        },
      });

      const products = response.hits.hits.map(hit => ({
        _id: hit._id,
        name: hit._source.name,
        brand: hit._source.brand,
        slug: hit._source.slug,
        price: hit._source.price,
        images: hit._source.images,
        ratings: { average: hit._source.ratingsAverage },
      }));

      const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

      const querySuggestions = products.map(p => ({
        text: p.name,
        type: 'product',
        id: p._id,
        slug: p.slug,
        image: p.images?.[0]?.url,
        price: p.price,
        brand: p.brand,
      }));

      const brandItems = brands.map(b => ({
        text: b,
        type: 'brand',
      }));

      return {
        suggestions: [...querySuggestions, ...brandItems],
        products,
        brands,
        categories: [],
      };
    } catch (err) {
      logger.error(`Elasticsearch autocomplete error: ${err.message}`);
      return { suggestions: [], products: [], brands: [], categories: [] };
    }
  }

  async barcodeSearch(tenantId, barcode) {
    if (!isElasticsearchConnected()) return null;

    try {
      const client = getClient();
      const response = await client.search({
        index: `${this.indexPrefix}products`,
        body: {
          query: {
            bool: {
              must: [
                { term: { tenantId } },
                { term: { barcode } },
                { term: { status: 'active' } },
              ],
            },
          },
          size: 1,
        },
      });

      if (response.hits.hits.length === 0) return null;
      return { _id: response.hits.hits[0]._id, ...response.hits.hits[0]._source };
    } catch (err) {
      logger.error(`Elasticsearch barcode search error: ${err.message}`);
      return null;
    }
  }

  async indexDocument(document) {
    if (!isElasticsearchConnected()) return;
    try {
      const client = getClient();
      const doc = {
        tenantId: document.tenantId?.toString(),
        name: document.name,
        brand: document.brand || '',
        description: document.description || '',
        shortDescription: document.shortDescription || '',
        tags: document.tags || [],
        price: document.price || 0,
        comparePrice: document.comparePrice || 0,
        category: document.category?.toString(),
        categoryName: document.categoryName || '',
        vendorId: document.vendorId?.toString(),
        vendorName: document.vendorName || '',
        vendorRating: document.vendorRating || 0,
        vendorIsFeatured: document.vendorIsFeatured || false,
        totalSold: document.totalSold || 0,
        ratingsAverage: document.ratings?.average || 0,
        ratingsCount: document.ratings?.count || 0,
        inStock: document.inStock !== undefined ? document.inStock : true,
        status: document.status || 'active',
        featured: document.featured || false,
        barcode: document.barcode || '',
        currency: document.currency || 'RWF',
        images: (document.images || []).map(img => ({ url: img.url, alt: img.alt || '' })),
        slug: document.slug || '',
        createdAt: document.createdAt || new Date(),
        updatedAt: document.updatedAt || new Date(),
      };

      await client.index({
        index: `${this.indexPrefix}products`,
        id: document._id?.toString(),
        body: doc,
        refresh: process.env.NODE_ENV === 'development' ? 'wait_for' : false,
      });

      logger.debug(`Indexed document ${document._id} in Elasticsearch`);
    } catch (err) {
      logger.error(`Elasticsearch index error: ${err.message}`);
    }
  }

  async bulkIndex(documents) {
    if (!isElasticsearchConnected() || !documents.length) return;
    try {
      const client = getClient();
      const body = documents.flatMap(doc => [
        { index: { _index: `${this.indexPrefix}products`, _id: doc._id?.toString() } },
        {
          tenantId: doc.tenantId?.toString(),
          name: doc.name,
          brand: doc.brand || '',
          description: doc.description || '',
          shortDescription: doc.shortDescription || '',
          tags: doc.tags || [],
          price: doc.price || 0,
          comparePrice: doc.comparePrice || 0,
          category: doc.category?.toString(),
          categoryName: doc.categoryName || '',
          vendorId: doc.vendorId?.toString(),
          vendorName: doc.vendorName || '',
          vendorRating: doc.vendorRating || 0,
          vendorIsFeatured: doc.vendorIsFeatured || false,
          totalSold: doc.totalSold || 0,
          ratingsAverage: doc.ratings?.average || 0,
          ratingsCount: doc.ratings?.count || 0,
          inStock: doc.inStock !== undefined ? doc.inStock : true,
          status: doc.status || 'active',
          featured: doc.featured || false,
          barcode: doc.barcode || '',
          currency: doc.currency || 'RWF',
          images: (doc.images || []).map(img => ({ url: img.url, alt: img.alt || '' })),
          slug: doc.slug || '',
          createdAt: doc.createdAt || new Date(),
          updatedAt: doc.updatedAt || new Date(),
        },
      ]);

      const response = await client.bulk({ body, refresh: true });

      if (response.errors) {
        const errored = response.items.filter(i => i.index?.error);
        logger.error(`Elasticsearch bulk index had ${errored.length} errors`);
      } else {
        logger.info(`Elasticsearch bulk indexed ${documents.length} documents`);
      }
    } catch (err) {
      logger.error(`Elasticsearch bulk index error: ${err.message}`);
    }
  }

  async deleteDocument(id) {
    if (!isElasticsearchConnected()) return;
    try {
      const client = getClient();
      await client.delete({
        index: `${this.indexPrefix}products`,
        id: id.toString(),
      });
    } catch (err) {
      if (!err?.meta?.statusCode === 404) {
        logger.error(`Elasticsearch delete error: ${err.message}`);
      }
    }
  }

  async deleteByTenant(tenantId) {
    if (!isElasticsearchConnected()) return;
    try {
      const client = getClient();
      await client.deleteByQuery({
        index: `${this.indexPrefix}products`,
        body: { query: { term: { tenantId: tenantId.toString() } } },
        refresh: true,
      });
      logger.info(`Deleted all Elasticsearch documents for tenant ${tenantId}`);
    } catch (err) {
      logger.error(`Elasticsearch deleteByTenant error: ${err.message}`);
    }
  }

  async getIndexStats() {
    if (!isElasticsearchConnected()) return null;
    try {
      const client = getClient();
      const [count, health] = await Promise.all([
        client.count({ index: `${this.indexPrefix}products` }),
        client.cluster.health({ index: `${this.indexPrefix}products` }),
      ]);
      return {
        documentCount: count.count,
        clusterStatus: health.status,
        indexName: `${this.indexPrefix}products`,
      };
    } catch (err) {
      logger.error(`Elasticsearch stats error: ${err.message}`);
      return null;
    }
  }
}

module.exports = new SearchElasticsearch();
