const logger = require('../utils/logger');

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'is', 'it', 'and', 'or', 'of', 'to', 'in', 'for', 'on',
  'with', 'as', 'at', 'by', 'from', 'was', 'are', 'been', 'has', 'had',
  'have', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'can', 'shall', 'might', 'must', 'not', 'no', 'nor', 'so', 'if', 'but',
  'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
  'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
  'too', 'very', 'just', 'because', 'than', 'also', 'now', 'i', 'me', 'my',
  'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself',
  'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am',
  'buy', 'get', 'find', 'want', 'looking', 'search', 'need', 'show',
  'please', 'help', 'best', 'top', 'new', 'good', 'great',
]);

const CATEGORY_KEYWORDS = {
  electronics: ['phone', 'laptop', 'computer', 'tablet', 'tv', 'television', 'camera', 'headphone', 'speaker', 'charger', 'cable', 'mouse', 'keyboard', 'monitor', 'printer', 'router'],
  clothing: ['shirt', 'dress', 'pants', 'jeans', 'shorts', 'jacket', 'coat', 'sweater', 'hoodie', 'socks', 'shoes', 'boots', 'sandals', 'hat', 'cap', 'belt', 'tie', 'scarf', 'gloves', 'underwear'],
  food: ['food', 'snack', 'drink', 'beverage', 'coffee', 'tea', 'chocolate', 'candy', 'cookie', 'bread', 'rice', 'pasta', 'oil', 'spice', 'sauce', 'can', 'bottle', 'pack'],
  home: ['furniture', 'chair', 'table', 'bed', 'sofa', 'cabinet', 'shelf', 'lamp', 'decor', 'curtain', 'rug', 'pillow', 'blanket', 'towel', 'kitchen', 'cookware'],
  sports: ['sport', 'fitness', 'gym', 'yoga', 'exercise', 'ball', 'racket', 'bike', 'treadmill', 'dumbbell', 'weights'],
  beauty: ['beauty', 'cosmetic', 'makeup', 'skincare', 'hair', 'perfume', 'cologne', 'lotion', 'cream', 'soap', 'shampoo', 'conditioner'],
  books: ['book', 'magazine', 'journal', 'notebook', 'textbook', 'novel', 'guide', 'manual'],
};

function removeStopWords(tokens) {
  return tokens.filter(t => !STOP_WORDS.has(t.toLowerCase()));
}

function detectCategoryIntent(query) {
  const lower = query.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return category;
    }
  }
  return null;
}

function expandAcronyms(query) {
  const acronyms = {
    tv: 'television',
    pc: 'computer',
    laptop: 'laptop computer',
    phone: 'phone smartphone',
    fridge: 'refrigerator',
    ac: 'air conditioner',
    't-shirt': 't-shirt shirt',
    sneakers: 'sneakers shoes',
  };
  let expanded = query;
  for (const [acro, full] of Object.entries(acronyms)) {
    expanded = expanded.replace(new RegExp(`\\b${acro}\\b`, 'gi'), full);
  }
  return expanded;
}

function normalizeQuery(query) {
  if (!query) return '';
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\sÀ-ÿñÑ-]+/g, ' ')
    .trim();
}

function tokenize(query) {
  return query.split(/\s+/).filter(Boolean);
}

function extractPriceIntent(query) {
  const pricePatterns = [
    { pattern: /(?:under|less than|below|cheaper than|max|up to)\s*(\d[\d,.]*)/i, type: 'max' },
    { pattern: /(?:over|above|more than|min|from|starting at)\s*(\d[\d,.]*)/i, type: 'min' },
    { pattern: /(\d[\d,.]*)\s*(?:to|-|–)\s*(\d[\d,.]*)/i, type: 'range' },
    { pattern: /(\d[\d,.]*)\s*(?:rwf|usd|eur|frw|r\$)/i, type: 'exact' },
  ];

  for (const { pattern, type } of pricePatterns) {
    const match = query.match(pattern);
    if (match) {
      if (type === 'range') {
        return { min: parseFloat(match[1].replace(/,/g, '')), max: parseFloat(match[2].replace(/,/g, '')) };
      }
      if (type === 'max') return { max: parseFloat(match[1].replace(/,/g, '')) };
      if (type === 'min') return { min: parseFloat(match[1].replace(/,/g, '')) };
      if (type === 'exact') return { exact: parseFloat(match[1].replace(/,/g, '')) };
    }
  }
  return null;
}

function extractSortIntent(query) {
  const sortPatterns = [
    { pattern: /(?:cheapest|lowest price|least expensive|price low)/i, sort: 'price_asc' },
    { pattern: /(?:most expensive|highest price|price high|pricey|premium)/i, sort: 'price_desc' },
    { pattern: /(?:best rated|top rated|highest rated|rated|popular)/i, sort: 'rating' },
    { pattern: /(?:newest|latest|recent|new arrival)/i, sort: 'newest' },
    { pattern: /(?:best seller|bestseller|most popular|trending)/i, sort: 'bestseller' },
  ];

  for (const { pattern, sort } of sortPatterns) {
    if (pattern.test(query)) return sort;
  }
  return null;
}

function extractLanguage(query) {
  const langPatterns = [
    { pattern: /[\u0980-\u09FF]+/, lang: 'bn' },
    { pattern: /[\u0600-\u06FF]+/, lang: 'ar' },
    { pattern: /[\u4E00-\u9FFF\u3400-\u4DBF]+/, lang: 'zh' },
    { pattern: /[\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9F]+/, lang: 'ja' },
    { pattern: /[\uAC00-\uD7AF]+/, lang: 'ko' },
    { pattern: /[\u0400-\u04FF]+/, lang: 'ru' },
    { pattern: /[áàâãäéèêëíìîïóòôõöúùûüýñç]/i, lang: 'fr' },
  ];

  for (const { pattern, lang } of langPatterns) {
    if (pattern.test(query)) return lang;
  }

  const langHints = [
    { words: ['rwf', 'frw', 'ikinyarwanda', 'rwanda', 'kigali'], lang: 'rw' },
    { words: ['bonjour', 'merci', 'prix', 'recherche', 'magasin', 'produit', 'acheter'], lang: 'fr' },
    { words: ['jambo', 'habari', 'bei', 'bidhaa', 'duka', 'nunua', 'tafuta'], lang: 'sw' },
  ];

  const lower = query.toLowerCase();
  for (const { words, lang } of langHints) {
    if (words.some(w => lower.includes(w))) return lang;
  }

  return 'en';
}

const searchOptimizer = (req, res, next) => {
  const startTime = Date.now();
  const originalQuery = req.query.q || '';

  if (!originalQuery) {
    req.searchOptimized = {
      original: '',
      normalized: '',
      tokens: [],
      language: 'en',
      filters: {},
      timing: { startTime },
    };
    return next();
  }

  const normalized = expandAcronyms(normalizeQuery(originalQuery));
  const tokens = tokenize(normalized);
  const meaningful = removeStopWords(tokens);

  const categoryIntent = detectCategoryIntent(normalized);
  const priceIntent = extractPriceIntent(normalized);
  const sortIntent = extractSortIntent(normalized);
  const language = extractLanguage(normalized);

  const cleanQuery = meaningful.join(' ');

  let categoryFromQuery = null;
  let priceFilters = null;
  let sortOption = null;

  if (categoryIntent && !req.query.category) {
    categoryFromQuery = categoryIntent;
  }

  if (priceIntent && !req.query.minPrice && !req.query.maxPrice) {
    priceFilters = priceIntent;
  }

  if (sortIntent && !req.query.sort) {
    sortOption = sortIntent;
  }

  const cleanedTokens = meaningful.filter(t => {
    if (priceIntent && /\d[\d,.]*/.test(t)) return false;
    if (CATEGORY_KEYWORDS[categoryIntent]?.includes(t.toLowerCase())) return false;
    return true;
  });

  const optimizedQuery = cleanedTokens.join(' ');

  req.searchOptimized = {
    original: originalQuery,
    normalized,
    tokens,
    meaningful,
    cleanQuery,
    optimizedQuery: optimizedQuery || cleanQuery,
    language,
    filters: {
      category: categoryFromQuery,
      price: priceFilters,
      sort: sortOption,
    },
    timing: { startTime },
  };

  logger.debug(`Search optimizer: "${originalQuery}" -> lang=${language}, cat=${categoryFromQuery}, sort=${sortOption}`);

  next();
};

module.exports = searchOptimizer;
