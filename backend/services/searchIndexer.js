const Product = require('../models/Product');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const TrendingSearch = require('../models/TrendingSearch');
const logger = require('../utils/logger');
const searchEngine = require('./searchEngine');
const searchElasticsearch = require('./searchElasticsearch');
const { isElasticsearchConnected } = require('../config/elasticsearch');

class SearchIndexer {
  async indexProduct(productId) {
    try {
      const product = await Product.findById(productId)
        .populate('vendorId', 'storeName ratings isFeatured')
        .lean();
      if (!product) return;

      await searchEngine.indexProduct(product);

      const ngrams = this.buildNGrams(product.name);
      const brandNgrams = product.brand ? this.buildNGrams(product.brand) : [];
      const allNgrams = [...new Set([...ngrams, ...brandNgrams])];

      const operations = allNgrams.map(ngram => ({
        updateOne: {
          filter: { tenantId: product.tenantId, normalizedQuery: ngram.toLowerCase(), period: 'daily' },
          update: {
            $setOnInsert: { query: ngram, period: 'daily', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            $inc: { score: 0.1 },
          },
          upsert: true,
        },
      }));

      if (operations.length > 0) {
        await TrendingSearch.bulkWrite(operations, { ordered: false });
      }

      logger.info(`Indexed product: ${product.name} (${productId})`);
    } catch (err) {
      logger.error(`Failed to index product ${productId}: ${err.message}`);
    }
  }

  async indexVendor(vendorId) {
    try {
      const vendor = await Vendor.findById(vendorId).lean();
      if (!vendor) return;

      const ngrams = this.buildNGrams(vendor.storeName);
      const operations = ngrams.map(ngram => ({
        updateOne: {
          filter: { tenantId: vendor.tenantId, normalizedQuery: ngram.toLowerCase(), period: 'daily' },
          update: {
            $setOnInsert: { query: ngram, period: 'daily', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            $inc: { score: 0.05 },
          },
          upsert: true,
        },
      }));

      if (operations.length > 0) {
        await TrendingSearch.bulkWrite(operations, { ordered: false });
      }

      logger.info(`Indexed vendor: ${vendor.storeName} (${vendorId})`);
    } catch (err) {
      logger.error(`Failed to index vendor ${vendorId}: ${err.message}`);
    }
  }

  async indexCategory(categoryId) {
    try {
      const category = await Category.findById(categoryId).lean();
      if (!category) return;

      const ngrams = this.buildNGrams(category.name);
      const operations = ngrams.map(ngram => ({
        updateOne: {
          filter: { tenantId: category.tenantId, normalizedQuery: ngram.toLowerCase(), period: 'daily' },
          update: {
            $setOnInsert: { query: ngram, period: 'daily', expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
            $inc: { score: 0.05 },
          },
          upsert: true,
        },
      }));

      if (operations.length > 0) {
        await TrendingSearch.bulkWrite(operations, { ordered: false });
      }
    } catch (err) {
      logger.error(`Failed to index category ${categoryId}: ${err.message}`);
    }
  }

  async reindexAll(tenantId) {
    try {
      logger.info(`Starting full reindex for tenant ${tenantId}`);

      const products = await Product.find({ tenantId })
        .populate('vendorId', 'storeName ratings isFeatured')
        .lean();
      for (const product of products) {
        await this.indexProduct(product._id);
      }
      logger.info(`Reindexed ${products.length} products`);

      const vendors = await Vendor.find({ tenantId }).lean();
      for (const vendor of vendors) {
        await this.indexVendor(vendor._id);
      }

      const categories = await Category.find({ tenantId }).lean();
      for (const category of categories) {
        await this.indexCategory(category._id);
      }

      if (isElasticsearchConnected()) {
        const enrichedProducts = products.map(p => ({
          ...p,
          vendorName: p.vendorId?.storeName || '',
          vendorRating: p.vendorId?.ratings?.average || 0,
          vendorIsFeatured: p.vendorId?.isFeatured || false,
          inStock: true,
          categoryName: '',
        }));
        await searchElasticsearch.bulkIndex(enrichedProducts);
        logger.info(`Elasticsearch bulk indexed ${products.length} products for tenant ${tenantId}`);
      }

      logger.info(`Full reindex complete for tenant ${tenantId}`);
      return { products: products.length, vendors: vendors.length, categories: categories.length };
    } catch (err) {
      logger.error(`Full reindex failed for tenant ${tenantId}: ${err.message}`);
      throw err;
    }
  }

  buildNGrams(text, min = 2, max = 5) {
    if (!text) return [];
    const words = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean);
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
}

module.exports = new SearchIndexer();
