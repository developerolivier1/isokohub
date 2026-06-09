const Product = require('../models/Product');
const Category = require('../models/Category');
const Review = require('../models/Review');
const Inventory = require('../models/Inventory');
const Vendor = require('../models/Vendor');
const { AppError, asyncHandler } = require('../middleware/error');

exports.createProduct = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!vendor) throw new AppError('Vendor profile not found.', 404);

  const productData = { ...req.body, tenantId: req.tenantId, vendorId: vendor._id };

  if (req.files && req.files.length > 0) {
    productData.images = req.files.map((f, i) => ({
      url: f.path,
      isPrimary: i === 0,
      order: i,
    }));
  }

  const product = await Product.create(productData);

  if (product.variants && product.variants.length > 0) {
    for (const variant of product.variants) {
      await Inventory.create({
        tenantId: req.tenantId,
        productId: product._id,
        variantId: variant._id,
        sku: variant.sku || product.sku,
        quantity: variant.stock || 0,
      });
    }
  } else {
    await Inventory.create({
      tenantId: req.tenantId,
      productId: product._id,
      sku: product.sku,
      quantity: req.body.stock || 0,
    });
  }

  vendor.productCount = await Product.countDocuments({ vendorId: vendor._id, status: { $ne: 'deleted' } });
  await vendor.save();

  res.status(201).json({ success: true, data: { product } });
});

exports.getProducts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, sort, category, search, minPrice, maxPrice, vendor, status, featured } = req.query;
  const filter = { tenantId: req.tenantId, status: { $ne: 'deleted' } };

  if (req.user && req.user.role === 'vendor' && !vendor) {
    const vendorDoc = await Vendor.findOne({ userId: req.user._id, tenantId: req.tenantId });
    if (vendorDoc) filter.vendorId = vendorDoc._id;
  }

  if (status) filter.status = status;
  else if (!req.user || req.user.role === 'customer') filter.status = 'active';

  if (category) filter.category = category;
  if (vendor) filter.vendorId = vendor;
  if (featured === 'true') filter.featured = true;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } },
    ];
  }

  let sortOption = { createdAt: -1 };
  if (sort === 'price_asc') sortOption = { price: 1 };
  else if (sort === 'price_desc') sortOption = { price: -1 };
  else if (sort === 'rating') sortOption = { 'ratings.average': -1 };
  else if (sort === 'sold') sortOption = { totalSold: -1 };
  else if (sort === 'newest') sortOption = { createdAt: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('vendorId', 'storeName storeLogo')
      .sort(sortOption).skip(skip).limit(parseInt(limit)),
    Product.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1,
      },
    },
  });
});

exports.getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
    status: { $ne: 'deleted' },
  }).populate('category', 'name slug')
    .populate('vendorId', 'storeName storeLogo storeSlug ratings');

  if (!product) throw new AppError('Product not found.', 404);

  const reviews = await Review.find({ productId: product._id, isApproved: true })
    .populate('userId', 'name avatar').sort({ createdAt: -1 }).limit(10);

  const relatedProducts = await Product.find({
    tenantId: req.tenantId,
    category: product.category,
    _id: { $ne: product._id },
    status: 'active',
  }).limit(8).select('name price images ratings');

  res.json({ success: true, data: { product, reviews, relatedProducts } });
});

exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!product) throw new AppError('Product not found.', 404);

  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor || product.vendorId.toString() !== vendor._id.toString()) {
      throw new AppError('Not authorized to update this product.', 403);
    }
  }

  const updatedFields = { ...req.body };
  delete updatedFields.ratings;
  delete updatedFields.totalSold;

  if (req.files && req.files.length > 0) {
    updatedFields.images = req.files.map((f, i) => ({
      url: f.path,
      isPrimary: i === 0,
      order: i,
    }));
  }

  Object.assign(product, updatedFields);
  await product.save();

  res.json({ success: true, data: { product } });
});

exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!product) throw new AppError('Product not found.', 404);

  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (!vendor || product.vendorId.toString() !== vendor._id.toString()) {
      throw new AppError('Not authorized.', 403);
    }
  }

  product.status = 'deleted';
  await product.save();

  res.json({ success: true, data: { message: 'Product deleted' } });
});

exports.bulkCreateProducts = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!vendor) throw new AppError('Vendor profile not found.', 404);

  const products = req.body.products.map(p => ({
    ...p,
    tenantId: req.tenantId,
    vendorId: vendor._id,
  }));

  const created = await Product.insertMany(products);

  vendor.productCount = await Product.countDocuments({ vendorId: vendor._id, status: { $ne: 'deleted' } });
  await vendor.save();

  res.status(201).json({ success: true, data: { products: created, count: created.length } });
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find({ tenantId: req.tenantId, isActive: true })
    .sort({ sortOrder: 1 });
  const tree = await Category.getTree(req.tenantId);
  res.json({ success: true, data: { categories, tree } });
});

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create({ ...req.body, tenantId: req.tenantId });
  res.status(201).json({ success: true, data: { category } });
});

exports.getCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!category) throw new AppError('Category not found.', 404);
  res.json({ success: true, data: { category } });
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!category) throw new AppError('Category not found.', 404);
  res.json({ success: true, data: { category } });
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!category) throw new AppError('Category not found.', 404);
  category.isActive = false;
  await category.save();
  res.json({ success: true, data: { message: 'Category deactivated' } });
});

exports.getFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({
    tenantId: req.tenantId,
    featured: true,
    status: 'active',
  }).populate('category', 'name slug').limit(20);
  res.json({ success: true, data: { products } });
});

exports.createReview = asyncHandler(async (req, res) => {
  const { rating, title, body } = req.body;
  const product = await Product.findOne({ _id: req.params.productId, tenantId: req.tenantId });
  if (!product) throw new AppError('Product not found.', 404);

  const existingReview = await Review.findOne({
    userId: req.user._id,
    productId: product._id,
    tenantId: req.tenantId,
  });
  if (existingReview) throw new AppError('You already reviewed this product.', 409);

  const review = await Review.create({
    tenantId: req.tenantId,
    userId: req.user._id,
    productId: product._id,
    vendorId: product.vendorId,
    rating,
    title,
    body,
    isVerifiedPurchase: false,
  });

  res.status(201).json({ success: true, data: { review } });
});
