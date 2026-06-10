const { Client } = require('@elastic/elasticsearch');
const logger = require('../utils/logger');

let client = null;
let isConnected = false;

function getElasticsearchConfig() {
  const url = process.env.ELASTICSEARCH_URL || '';
  const apiKey = process.env.ELASTICSEARCH_API_KEY || '';

  if (!url) return null;

  const config = { node: url };

  if (apiKey) {
    config.auth = { apiKey };
  }

  if (url.startsWith('https://')) {
    config.tls = { rejectUnauthorized: process.env.NODE_ENV === 'production' };
  }

  return config;
}

async function connectElasticsearch() {
  try {
    const esConfig = getElasticsearchConfig();
    if (!esConfig) {
      logger.info('Elasticsearch not configured, skipping connection');
      return null;
    }

    client = new Client(esConfig);

    const info = await client.info();
    isConnected = true;
    logger.info(`Connected to Elasticsearch v${info.version?.number || 'unknown'} at ${esConfig.node}`);

    const isOpenSearch = info.version?.distribution === 'opensearch';
    if (isOpenSearch) {
      logger.info('Detected OpenSearch distribution — using compatibility mode');
    }

    return client;
  } catch (err) {
    isConnected = false;
    logger.warn(`Elasticsearch connection failed: ${err.message}. Search will use MongoDB fallback.`);
    return null;
  }
}

function getClient() {
  return client;
}

function isElasticsearchConnected() {
  return isConnected && client !== null;
}

async function ensureIndex(indexName, mappings) {
  if (!client || !isConnected) return false;
  try {
    const exists = await client.indices.exists({ index: indexName });
    if (!exists) {
      await client.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                search_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding', 'edge_ngram_filter'],
                },
              },
              filter: {
                edge_ngram_filter: {
                  type: 'edge_ngram',
                  min_gram: 2,
                  max_gram: 20,
                },
              },
            },
          },
          mappings,
        },
      });
      logger.info(`Created Elasticsearch index: ${indexName}`);
    }
    return true;
  } catch (err) {
    logger.error(`Failed to ensure Elasticsearch index ${indexName}: ${err.message}`);
    return false;
  }
}

async function getIndexMapping() {
  return {
    properties: {
      tenantId: { type: 'keyword' },
      name: {
        type: 'text',
        analyzer: 'search_analyzer',
        fields: {
          keyword: { type: 'keyword' },
          suggest: { type: 'search_as_you_type' },
        },
      },
      brand: {
        type: 'text',
        analyzer: 'search_analyzer',
        fields: { keyword: { type: 'keyword' } },
      },
      description: { type: 'text', analyzer: 'search_analyzer' },
      shortDescription: { type: 'text' },
      tags: { type: 'keyword' },
      price: { type: 'float' },
      comparePrice: { type: 'float' },
      category: { type: 'keyword' },
      categoryName: { type: 'text' },
      vendorId: { type: 'keyword' },
      vendorName: { type: 'text' },
      vendorRating: { type: 'float' },
      vendorIsFeatured: { type: 'boolean' },
      totalSold: { type: 'integer' },
      ratingsAverage: { type: 'float' },
      ratingsCount: { type: 'integer' },
      inStock: { type: 'boolean' },
      status: { type: 'keyword' },
      featured: { type: 'boolean' },
      barcode: { type: 'keyword' },
      currency: { type: 'keyword' },
      images: { type: 'nested', properties: { url: { type: 'keyword' }, alt: { type: 'text' } } },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
    },
  };
}

module.exports = {
  connectElasticsearch,
  getClient,
  isElasticsearchConnected,
  ensureIndex,
  getIndexMapping,
  getElasticsearchConfig,
};
