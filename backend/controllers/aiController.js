const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const SocialPost = require('../models/SocialPost');
const { AppError, asyncHandler } = require('../middleware/error');
const logger = require('../utils/logger');

exports.getRecommendations = asyncHandler(async (req, res) => {
  const { productId, limit = 10 } = req.query;

  if (productId) {
    const product = await Product.findById(productId);
    if (!product) throw new AppError('Product not found.', 404);

    const frequentlyBought = await Order.aggregate([
      { $match: { tenantId: product.tenantId, 'items.productId': product._id, status: 'delivered' } },
      { $unwind: '$items' },
      { $match: { 'items.productId': { $ne: product._id } } },
      { $group: { _id: '$items.productId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
    ]);

    const similarProducts = await Product.find({
      tenantId: product.tenantId,
      category: product.category,
      _id: { $ne: product._id, $nin: frequentlyBought.map(fb => fb._id) },
      status: 'active',
    }).sort({ 'ratings.average': -1, totalSold: -1 }).limit(parseInt(limit));

    res.json({
      success: true,
      data: {
        frequentlyBoughtTogether: frequentlyBought,
        similarItems: similarProducts,
      },
    });
  } else {
    const topRated = await Product.find({
      tenantId: req.tenantId,
      status: 'active',
      'ratings.average': { $gte: 4 },
    }).sort({ 'ratings.count': -1, totalSold: -1 }).limit(parseInt(limit));

    res.json({
      success: true,
      data: { recommendations: topRated },
    });
  }
});

exports.searchProducts = asyncHandler(async (req, res) => {
  const { q, category, minPrice, maxPrice, sort, page = 1, limit = 20 } = req.query;
  if (!q) throw new AppError('Search query required.', 400);

  const filter = { tenantId: req.tenantId, status: 'active' };
  filter.$or = [
    { name: { $regex: q, $options: 'i' } },
    { description: { $regex: q, $options: 'i' } },
    { brand: { $regex: q, $options: 'i' } },
    { tags: { $in: [new RegExp(q, 'i')] } },
  ];

  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  let sortOption = { _score: { $meta: 'textScore' } };
  if (sort === 'price_asc') sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'rating') sortOption = { 'ratings.average': -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(parseInt(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
      query: q,
    },
  });
});

exports.getAutocomplete = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ success: true, data: { suggestions: [] } });

  const suggestions = await Product.find({
    tenantId: req.tenantId,
    status: 'active',
    name: { $regex: `^${q}`, $options: 'i' },
  }).select('name').limit(8);

  const brands = await Product.distinct('brand', {
    tenantId: req.tenantId,
    brand: { $regex: `^${q}`, $options: 'i' },
  }).limit(5);

  res.json({
    success: true,
    data: {
      suggestions: [
        ...suggestions.map(s => ({ type: 'product', text: s.name, id: s._id })),
        ...brands.map(b => ({ type: 'brand', text: b })),
      ],
    },
  });
});

exports.getTrendingProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    tenantId: req.tenantId,
    status: 'active',
  }).sort({ totalSold: -1, 'ratings.average': -1 }).limit(20);

  res.json({ success: true, data: { products } });
});

exports.assistantQuery = asyncHandler(async (req, res) => {
  const { query, context } = req.body;
  if (!query) throw new AppError('Query is required.', 400);

  const intentKeywords = {
    order: ['order', 'track', 'delivery', 'shipping', 'where is my'],
    return: ['return', 'refund', 'exchange', 'cancel'],
    product: ['product', 'item', 'buy', 'price', 'cost', 'recommend'],
    help: ['help', 'support', 'contact', 'faq', 'how to'],
    account: ['account', 'profile', 'password', 'login', 'settings'],
  };

  let intent = 'general';
  const lowerQuery = query.toLowerCase();
  for (const [key, keywords] of Object.entries(intentKeywords)) {
    if (keywords.some(kw => lowerQuery.includes(kw))) {
      intent = key;
      break;
    }
  }

  let response = '';

  switch (intent) {
    case 'order':
      response = 'You can track your orders in the Orders section of your account. Each order has a real-time tracking number. Would you like me to look up a specific order?';
      break;
    case 'return':
      response = 'Returns can be initiated within 30 days of delivery. Go to your Orders, select the item, and click "Return". I can help you start a return if you provide your order number.';
      break;
    case 'product':
      const products = await Product.find({
        tenantId: req.tenantId,
        status: 'active',
        name: { $regex: query.split(' ').filter(w => w.length > 2).join('|'), $options: 'i' },
      }).limit(3).select('name price images');
      if (products.length > 0) {
        response = `Here are some products I found: ${products.map(p => `${p.name} (${p.currency || 'RWF'} ${p.price.toLocaleString()})`).join(', ')}. Would you like more details on any of these?`;
      } else {
        response = 'I could not find specific products matching your query. Try browsing our categories or use the search bar for more precise results.';
      }
      break;
    case 'help':
      response = 'I\'m here to help! You can contact our support team via email at support@isokohub.com, call us at +250788000000, or visit our Help Center for FAQs and guides.';
      break;
    case 'account':
      response = 'You can manage your account settings in your profile. This includes updating your password, email preferences, and address book. Need help with something specific?';
      break;
    default:
      response = 'I understand your question but need more information to provide a specific answer. Could you please provide more details? For example, are you asking about a product, order, or account issue?';
  }

  res.json({
    success: true,
    data: {
      response,
      intent,
      timestamp: new Date(),
    },
  });
});

exports.getPersonalizedFeed = asyncHandler(async (req, res) => {
  if (!req.user) {
    const products = await Product.find({
      tenantId: req.tenantId,
      status: 'active',
      featured: true,
    }).sort({ totalSold: -1 }).limit(20);
    return res.json({ success: true, data: { feed: products } });
  }

  const userOrders = await Order.find({ userId: req.user._id, tenantId: req.tenantId })
    .populate('items.productId').limit(5);

  const categoryIds = [...new Set(userOrders.flatMap(o =>
    o.items.filter(i => i.productId).map(i => i.productId.category)
  ).filter(Boolean))];

  const feedProducts = await Product.find({
    tenantId: req.tenantId,
    status: 'active',
    $or: [
      { category: { $in: categoryIds } },
      { featured: true },
    ],
  }).sort({ totalSold: -1, 'ratings.average': -1 }).limit(30);

  res.json({ success: true, data: { feed: feedProducts } });
});
