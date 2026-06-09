const express = require('express');
const router = express.Router();

const { protect, optionalAuth } = require('../middleware/auth');
const { authorize, authorizeVendor, authorizeAdmin, authorizeSuperAdmin } = require('../middleware/rbac');
const { resolveTenant, requireTenantFeature, checkTenantCapacity } = require('../middleware/tenant');
const { authLimiter } = require('../middleware/rateLimiter');

const authController = require('../controllers/authController');
const productController = require('../controllers/productController');
const orderController = require('../controllers/orderController');
const walletController = require('../controllers/walletController');
const tenantController = require('../controllers/tenantController');
const aiController = require('../controllers/aiController');
const liveController = require('../controllers/liveController');
const adController = require('../controllers/adController');
const logisticsController = require('../controllers/logisticsController');
const reportController = require('../controllers/reportController');

// User Management Routes (admin only)
router.get('/users', protect, authorizeAdmin, async (req, res) => {
  const User = require('../models/User');
  const { page = 1, limit = 20, search, role, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const query = { tenantId: req.tenantId };
  if (search) query.name = { $regex: search, $options: 'i' };
  if (role) query.role = role;
  if (status === 'active') query.isActive = true;
  else if (status === 'inactive') query.isActive = false;

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    User.countDocuments(query),
  ]);
  res.json({
    success: true,
    data: {
      users: users.map(u => u.toPublicProfile()),
      pagination: { page: parseInt(page), limit: parseInt(limit), total },
    },
  });
});
router.get('/users/:id', protect, authorizeAdmin, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
  res.json({ success: true, data: { user: user.toPublicProfile() } });
});
router.put('/users/:id/status', protect, authorizeAdmin, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
  if (user.role === 'superadmin') return res.status(403).json({ success: false, error: { message: 'Cannot modify superadmin' } });
  user.isActive = req.body.isActive;
  await user.save();
  res.json({ success: true, data: { user: user.toPublicProfile() } });
});
router.put('/users/:id/role', protect, authorizeAdmin, async (req, res) => {
  const User = require('../models/User');
  const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!user) return res.status(404).json({ success: false, error: { message: 'User not found' } });
  if (user.role === 'superadmin') return res.status(403).json({ success: false, error: { message: 'Cannot modify superadmin' } });
  const validRoles = ['customer', 'vendor', 'delivery_driver', 'support'];
  if (!validRoles.includes(req.body.role)) return res.status(400).json({ success: false, error: { message: `Invalid role. Must be one of: ${validRoles.join(', ')}` } });
  user.role = req.body.role;
  await user.save();
  res.json({ success: true, data: { user: user.toPublicProfile() } });
});

// Auth Routes (no tenant resolution required — these endpoints either don't need a tenant
// or accept tenantSlug in the body)
router.post('/auth/register-tenant', authLimiter, authController.registerTenantAdmin);
router.post('/auth/login', authLimiter, authController.login);

// All subsequent routes require tenant context
router.use(resolveTenant);

router.post('/auth/register', authLimiter, authController.register);
router.post('/auth/logout', authController.logout);
router.post('/auth/refresh', authController.refreshToken);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/me', protect, authController.getMe);
router.put('/auth/profile', protect, authController.updateProfile);
router.put('/auth/password', protect, authController.updatePassword);
router.post('/auth/send-otp', protect, authController.sendPhoneOTP);
router.post('/auth/verify-otp', protect, authController.verifyPhoneOTP);

// Product Routes
router.get('/products', optionalAuth, productController.getProducts);
router.get('/products/featured', productController.getFeaturedProducts);
router.get('/products/:id', productController.getProduct);
router.post('/products', protect, authorizeVendor, checkTenantCapacity('product'), productController.createProduct);
router.put('/products/:id', protect, authorizeVendor, productController.updateProduct);
router.delete('/products/:id', protect, authorizeVendor, productController.deleteProduct);
router.post('/products/bulk', protect, authorizeVendor, productController.bulkCreateProducts);
router.post('/products/:productId/reviews', protect, productController.createReview);

// Category Routes
router.get('/categories', productController.getCategories);
router.get('/categories/:id', productController.getCategory);
router.post('/categories', protect, authorizeAdmin, productController.createCategory);
router.put('/categories/:id', protect, authorizeAdmin, productController.updateCategory);
router.delete('/categories/:id', protect, authorizeAdmin, productController.deleteCategory);

// Cart Routes (handled in orderController for simplicity - can be extended)
router.get('/cart', protect, async (req, res) => {
  const Cart = require('../models/Cart');
  let cart = await Cart.findOne({ userId: req.user._id, tenantId: req.tenantId })
    .populate('items.productId', 'name price images status');
  if (!cart) {
    cart = await Cart.create({ userId: req.user._id, tenantId: req.tenantId });
  }
  res.json({ success: true, data: { cart } });
});
router.post('/cart/items', protect, async (req, res) => {
  const Cart = require('../models/Cart');
  let cart = await Cart.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!cart) cart = await Cart.create({ userId: req.user._id, tenantId: req.tenantId });
  await cart.addItem(req.body);
  res.json({ success: true, data: { cart } });
});
router.put('/cart/items/:productId', protect, async (req, res) => {
  const Cart = require('../models/Cart');
  const cart = await Cart.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!cart) return res.status(404).json({ success: false, error: { message: 'Cart not found' } });
  await cart.updateQuantity(req.params.productId, req.body.quantity, req.body.variantId);
  res.json({ success: true, data: { cart } });
});
router.delete('/cart/items/:productId', protect, async (req, res) => {
  const Cart = require('../models/Cart');
  const cart = await Cart.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!cart) return res.status(404).json({ success: false, error: { message: 'Cart not found' } });
  await cart.removeItem(req.params.productId, req.body.variantId);
  res.json({ success: true, data: { cart } });
});
router.delete('/cart', protect, async (req, res) => {
  const Cart = require('../models/Cart');
  const cart = await Cart.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (cart) await cart.clear();
  res.json({ success: true, data: { message: 'Cart cleared' } });
});

// Order Routes
router.get('/orders', protect, orderController.getOrders);
router.get('/orders/:id', protect, orderController.getOrder);
router.post('/orders', protect, orderController.createOrder);
router.put('/orders/:id/status', protect, authorize(['vendor', 'tenant_admin', 'superadmin', 'delivery_driver']), orderController.updateOrderStatus);
router.post('/orders/:id/cancel', protect, orderController.cancelOrder);
router.get('/orders/:id/status-history', protect, orderController.getOrderStatusHistory);

// Wishlist Routes
router.get('/wishlist', protect, async (req, res) => {
  const Wishlist = require('../models/Wishlist');
  const wishlist = await Wishlist.findOne({ userId: req.user._id, tenantId: req.tenantId })
    .populate('items.productId', 'name price images ratings status');
  if (!wishlist) return res.json({ success: true, data: { wishlist: { items: [] } } });
  res.json({ success: true, data: { wishlist } });
});
router.post('/wishlist/items', protect, async (req, res) => {
  const Wishlist = require('../models/Wishlist');
  let wishlist = await Wishlist.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!wishlist) wishlist = await Wishlist.create({ userId: req.user._id, tenantId: req.tenantId });
  await wishlist.addProduct(req.body.productId, req.body.variantId, req.body.price);
  res.json({ success: true, data: { wishlist } });
});
router.delete('/wishlist/items/:productId', protect, async (req, res) => {
  const Wishlist = require('../models/Wishlist');
  const wishlist = await Wishlist.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (wishlist) await wishlist.removeProduct(req.params.productId, req.body.variantId);
  res.json({ success: true, data: { wishlist } });
});

// Wallet Routes
router.get('/wallet', protect, walletController.getWallet);
router.get('/wallet/balance', protect, walletController.getWalletBalance);
router.get('/wallet/transactions', protect, walletController.getTransactions);
router.get('/wallet/statement', protect, walletController.generateWalletStatement);
router.post('/wallet/transfer', protect, walletController.transferFunds);
router.post('/wallet/withdraw', protect, walletController.requestWithdrawal);
router.get('/wallet/withdrawals', protect, walletController.getWithdrawals);
router.put('/wallet/withdrawals/:id/process', protect, authorizeAdmin, walletController.processWithdrawal);

// Payment Routes
router.post('/payments/process', protect, async (req, res) => {
  const { orderId, method } = req.body;
  const Order = require('../models/Order');
  const Payment = require('../models/Payment');
  const order = await Order.findOne({ _id: orderId, tenantId: req.tenantId });
  if (!order) return res.status(404).json({ success: false, error: { message: 'Order not found' } });

  if (order.paymentStatus === 'paid') return res.status(400).json({ success: false, error: { message: 'Order already paid' } });

  const payment = await Payment.create({
    tenantId: req.tenantId,
    userId: req.user._id,
    orderId: order._id,
    amount: order.total,
    currency: order.currency,
    method,
    status: method === 'cod' ? 'pending' : 'processing',
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
  });

  order.paymentId = payment._id;
  order.paymentStatus = method === 'cod' ? 'pending' : 'processing';
  if (method === 'cod') order.status = 'confirmed';
  await order.save();

  if (method !== 'cod' && method !== 'wallet') {
    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    await order.save();
  }

  if (method === 'wallet') {
    const Wallet = require('../models/Wallet');
    const wallet = await Wallet.findOne({ userId: req.user._id, tenantId: req.tenantId });
    if (!wallet || wallet.balance < order.total) return res.status(400).json({ success: false, error: { message: 'Insufficient wallet balance' } });
    wallet.balance -= order.total;
    await wallet.save();
    payment.status = 'paid';
    payment.paidAt = new Date();
    await payment.save();
    order.paymentStatus = 'paid';
    order.status = 'confirmed';
    await order.save();
  }

  res.json({ success: true, data: { payment, order } });
});

// Coupon Routes
router.get('/coupons', protect, async (req, res) => {
  const Coupon = require('../models/Coupon');
  const coupons = await Coupon.find({ tenantId: req.tenantId });
  res.json({ success: true, data: { coupons } });
});
router.post('/coupons/validate', protect, async (req, res) => {
  const Coupon = require('../models/Coupon');
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: code.toUpperCase(), tenantId: req.tenantId });
  if (!coupon) return res.status(404).json({ success: false, error: { message: 'Coupon not found' } });
  const validity = await coupon.isValid(req.user._id, orderAmount);
  const discount = validity.valid ? coupon.calculateDiscount(orderAmount) : 0;
  res.json({ success: true, data: { valid: validity.valid, reason: validity.reason, discount, coupon } });
});
router.post('/coupons', protect, authorizeAdmin, async (req, res) => {
  const Coupon = require('../models/Coupon');
  const coupon = await Coupon.create({ ...req.body, tenantId: req.tenantId, createdBy: req.user._id });
  res.status(201).json({ success: true, data: { coupon } });
});

// Tenant Routes
router.get('/tenant', protect, tenantController.getTenant);
router.put('/tenant', protect, authorizeAdmin, tenantController.updateTenant);
router.get('/tenant/settings', protect, tenantController.getTenantSettings);
router.put('/tenant/settings', protect, authorizeAdmin, tenantController.updateTenantSetting);
router.get('/tenant/stats', protect, authorizeAdmin, tenantController.getTenantStats);
router.get('/tenant/subscription', protect, tenantController.getSubscription);
router.put('/tenant/subscription', protect, authorizeAdmin, tenantController.updateSubscription);

// Domain Routes
router.get('/tenant/domains', protect, authorizeAdmin, tenantController.getDomainSettings);
router.post('/tenant/domains', protect, authorizeAdmin, tenantController.addDomain);
router.post('/tenant/domains/:id/verify', protect, authorizeAdmin, tenantController.verifyDomain);
router.delete('/tenant/domains/:id', protect, authorizeAdmin, tenantController.removeDomain);

// Vendor Routes
router.get('/vendors', async (req, res) => {
  const Vendor = require('../models/Vendor');
  const vendors = await Vendor.find({ tenantId: req.tenantId, status: 'verified' })
    .select('storeName storeLogo storeSlug description ratings productCount');
  res.json({ success: true, data: { vendors } });
});
router.get('/vendors/:id', async (req, res) => {
  const Vendor = require('../models/Vendor');
  const vendor = await Vendor.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!vendor) return res.status(404).json({ success: false, error: { message: 'Vendor not found' } });
  res.json({ success: true, data: { vendor: vendor.toPublicProfile() } });
});
router.post('/vendors', protect, checkTenantCapacity('vendor'), async (req, res) => {
  const Vendor = require('../models/Vendor');
  const existing = await Vendor.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (existing) return res.status(409).json({ success: false, error: { message: 'Vendor profile already exists' } });
  const vendor = await Vendor.create({ ...req.body, tenantId: req.tenantId, userId: req.user._id });
  res.status(201).json({ success: true, data: { vendor: vendor.toPublicProfile() } });
});
router.put('/vendors/:id', protect, async (req, res) => {
  const Vendor = require('../models/Vendor');
  const vendor = await Vendor.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!vendor) return res.status(404).json({ success: false, error: { message: 'Vendor not found' } });
  if (vendor.userId.toString() !== req.user._id.toString() && !['tenant_admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ success: false, error: { message: 'Not authorized' } });
  }
  Object.assign(vendor, req.body);
  await vendor.save();
  res.json({ success: true, data: { vendor: vendor.toPublicProfile() } });
});
router.put('/vendors/:id/verify', protect, authorizeAdmin, async (req, res) => {
  const Vendor = require('../models/Vendor');
  const vendor = await Vendor.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!vendor) return res.status(404).json({ success: false, error: { message: 'Vendor not found' } });
  vendor.status = req.body.status || 'verified';
  vendor.verification.verifiedBy = req.user._id;
  vendor.verification.verifiedAt = new Date();
  if (req.body.rejectionReason) vendor.verification.rejectionReason = req.body.rejectionReason;
  await vendor.save();
  res.json({ success: true, data: { vendor: vendor.toPublicProfile() } });
});

// AI & Search Routes
router.get('/ai/recommendations', aiController.getRecommendations);
router.get('/ai/search', aiController.searchProducts);
router.get('/ai/autocomplete', aiController.getAutocomplete);
router.get('/ai/trending', aiController.getTrendingProducts);
router.post('/ai/assistant', optionalAuth, aiController.assistantQuery);
router.get('/ai/feed', optionalAuth, aiController.getPersonalizedFeed);

// Live Stream Routes
router.get('/live', liveController.getLiveStreams);
router.get('/live/:id', liveController.getLiveStream);
router.post('/live', protect, authorizeVendor, requireTenantFeature('liveStreaming'), liveController.createLiveStream);
router.put('/live/:id', protect, authorizeVendor, liveController.updateLiveStream);
router.post('/live/:id/start', protect, authorizeVendor, liveController.startLiveStream);
router.post('/live/:id/end', protect, authorizeVendor, liveController.endLiveStream);
router.post('/live/:id/products', protect, authorizeVendor, liveController.addProductToStream);
router.delete('/live/:id/products/:productId', protect, authorizeVendor, liveController.removeProductFromStream);
router.post('/live/:id/comments', protect, liveController.addComment);
router.post('/live/:id/reactions', protect, liveController.addReaction);

// Advertisement Routes
router.get('/ads', adController.getAds);
router.get('/ads/placement', adController.getPlacementAds);
router.get('/ads/analytics', protect, authorizeVendor, adController.getAdAnalytics);
router.get('/ads/:id', adController.getAd);
router.post('/ads', protect, authorizeVendor, adController.createAd);
router.put('/ads/:id', protect, authorizeVendor, adController.updateAd);
router.delete('/ads/:id', protect, authorizeVendor, adController.deleteAd);
router.put('/ads/:id/pause', protect, authorizeVendor, adController.pauseAd);
router.put('/ads/:id/resume', protect, authorizeVendor, adController.resumeAd);
router.post('/ads/:id/click', optionalAuth, adController.trackClick);
router.get('/campaigns', protect, authorizeVendor, adController.getCampaigns);
router.get('/campaigns/:id', protect, authorizeVendor, adController.getCampaign);
router.post('/campaigns', protect, authorizeVendor, adController.createCampaign);
router.put('/campaigns/:id', protect, authorizeVendor, adController.updateCampaign);

// Logistics Routes
router.get('/warehouses', logisticsController.getWarehouses);
router.get('/warehouses/all', protect, authorizeVendor, logisticsController.getAllWarehouses);
router.get('/warehouses/nearby', logisticsController.getNearestWarehouse);
router.get('/warehouses/:id', logisticsController.getWarehouse);
router.post('/warehouses', protect, authorizeAdmin, logisticsController.createWarehouse);
router.put('/warehouses/:id', protect, authorizeAdmin, logisticsController.updateWarehouse);
router.delete('/warehouses/:id', protect, authorizeAdmin, logisticsController.deleteWarehouse);
router.get('/warehouses/:id/inventory', protect, authorizeVendor, logisticsController.getWarehouseInventory);
router.put('/warehouses/:id/inventory', protect, authorizeVendor, logisticsController.updateWarehouseInventory);

router.get('/transfers', protect, authorizeAdmin, logisticsController.getTransfers);
router.post('/transfers', protect, authorizeAdmin, logisticsController.createTransfer);
router.put('/transfers/:id/approve', protect, authorizeAdmin, logisticsController.approveTransfer);
router.put('/transfers/:id/complete', protect, authorizeAdmin, logisticsController.completeTransfer);

router.get('/delivery/partners', protect, authorizeAdmin, logisticsController.getDeliveryPartners);
router.post('/delivery/partners', protect, authorizeAdmin, logisticsController.createDeliveryPartner);
router.get('/delivery/drivers', protect, logisticsController.getDrivers);
router.get('/delivery/drivers/:id', protect, logisticsController.getDriver);
router.post('/delivery/drivers/register', protect, logisticsController.registerDriver);
router.put('/delivery/drivers/location', protect, logisticsController.updateDriverLocation);
router.post('/delivery/assign', protect, authorizeAdmin, logisticsController.assignDelivery);
router.get('/delivery/tracking/:orderId', protect, logisticsController.getTracking);
router.put('/delivery/tracking/:orderId', protect, logisticsController.updateDeliveryStatus);
router.post('/delivery/tracking/:orderId/verify-otp', protect, logisticsController.verifyDeliveryOTP);
router.get('/delivery/low-stock', protect, authorizeVendor, logisticsController.getLowStockAlert);

// Report Routes
router.get('/reports/dashboard', protect, reportController.getDashboardStats);
router.get('/reports/sales', protect, authorizeAdmin, reportController.getSalesReport);
router.get('/reports/products', protect, authorizeAdmin, reportController.getProductReport);
router.get('/reports/revenue', protect, authorizeAdmin, reportController.getRevenueReport);
router.get('/reports/customers', protect, authorizeAdmin, reportController.getCustomerReport);
router.get('/reports/download', protect, authorizeAdmin, reportController.downloadReport);
router.get('/reports/invoice/:orderId', protect, reportController.downloadInvoice);

// Notification Routes
router.get('/notifications', protect, async (req, res) => {
  const Notification = require('../models/Notification');
  const { page = 1, limit = 20 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ userId: req.user._id, tenantId: req.tenantId, isArchived: false })
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Notification.countDocuments({ userId: req.user._id, tenantId: req.tenantId }),
    Notification.getUnreadCount(req.user._id, req.tenantId),
  ]);
  res.json({ success: true, data: { notifications, unreadCount, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
});
router.put('/notifications/:id/read', protect, async (req, res) => {
  const Notification = require('../models/Notification');
  await Notification.markAsRead(req.params.id, req.user._id);
  res.json({ success: true, data: { message: 'Marked as read' } });
});
router.put('/notifications/read-all', protect, async (req, res) => {
  const Notification = require('../models/Notification');
  await Notification.markAllAsRead(req.user._id, req.tenantId);
  res.json({ success: true, data: { message: 'All marked as read' } });
});

// Chat Routes
router.get('/chat/conversations', protect, async (req, res) => {
  const ChatMessage = require('../models/ChatMessage');
  const conversations = await ChatMessage.aggregate([
    { $match: { tenantId: req.tenantId, $or: [{ senderId: req.user._id }, { receiverId: req.user._id }] } },
    { $sort: { createdAt: -1 } },
    { $group: { _id: { $cond: [{ $eq: ['$senderId', req.user._id] }, '$receiverId', '$senderId'] }, lastMessage: { $first: '$$ROOT' }, unread: { $sum: { $cond: [{ $and: [{ $eq: ['$receiverId', req.user._id] }, { $eq: ['$isRead', false] }] }, 1, 0] } } } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $project: { 'user.name': 1, 'user.avatar': 1, lastMessage: 1, unread: 1 } },
    { $sort: { 'lastMessage.createdAt': -1 } },
  ]);
  res.json({ success: true, data: { conversations } });
});
router.get('/chat/:userId', protect, async (req, res) => {
  const ChatMessage = require('../models/ChatMessage');
  const messages = await ChatMessage.getConversation(req.user._id, req.params.userId, req.tenantId);
  await ChatMessage.markConversationRead(req.user._id, req.params.userId, req.tenantId);
  res.json({ success: true, data: { messages } });
});
router.post('/chat/:userId', protect, async (req, res) => {
  const ChatMessage = require('../models/ChatMessage');
  const convId = `conv:${[req.user._id.toString(), req.params.userId].sort().join(':')}`;
  const message = await ChatMessage.create({
    tenantId: req.tenantId,
    conversationId: convId,
    senderId: req.user._id,
    receiverId: req.params.userId,
    message: req.body.message,
    type: req.body.type || 'text',
    metadata: req.body.metadata,
  });
  res.status(201).json({ success: true, data: { message } });
});

// Upload Routes
router.post('/upload', protect, async (req, res) => {
  const { uploadSingleImage, handleUploadError } = require('../middleware/upload');
  uploadSingleImage(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, () => {});
    if (!req.file) return res.status(400).json({ success: false, error: { message: 'No file uploaded' } });
    res.json({ success: true, data: { url: req.file.path, filename: req.file.filename } });
  });
});
router.post('/upload/multiple', protect, async (req, res) => {
  const { uploadMultipleImages, handleUploadError } = require('../middleware/upload');
  uploadMultipleImages(req, res, (err) => {
    if (err) return handleUploadError(err, req, res, () => {});
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, error: { message: 'No files uploaded' } });
    const files = req.files.map(f => ({ url: f.path, filename: f.filename }));
    res.json({ success: true, data: { files } });
  });
});

// Social Routes
router.get('/social/feed', optionalAuth, async (req, res) => {
  const SocialPost = require('../models/SocialPost');
  const posts = await SocialPost.find({ tenantId: req.tenantId, isActive: true, privacy: 'public' })
    .populate('userId', 'name avatar').sort({ createdAt: -1 }).limit(30);
  res.json({ success: true, data: { posts } });
});
router.post('/social/posts', protect, async (req, res) => {
  const SocialPost = require('../models/SocialPost');
  const post = await SocialPost.create({ ...req.body, tenantId: req.tenantId, userId: req.user._id });
  res.status(201).json({ success: true, data: { post } });
});
router.post('/social/follow/:userId', protect, async (req, res) => {
  const Follow = require('../models/Follow');
  const follow = await Follow.create({ tenantId: req.tenantId, followerId: req.user._id, followingId: req.params.userId });
  res.status(201).json({ success: true, data: { follow } });
});
router.delete('/social/follow/:userId', protect, async (req, res) => {
  const Follow = require('../models/Follow');
  await Follow.findOneAndDelete({ followerId: req.user._id, followingId: req.params.userId, tenantId: req.tenantId });
  res.json({ success: true, data: { message: 'Unfollowed' } });
});
router.get('/social/followers/:userId', async (req, res) => {
  const Follow = require('../models/Follow');
  const result = await Follow.getFollowers(req.params.userId, req.tenantId);
  res.json({ success: true, data: result });
});
router.get('/social/following/:userId', async (req, res) => {
  const Follow = require('../models/Follow');
  const result = await Follow.getFollowing(req.params.userId, req.tenantId);
  res.json({ success: true, data: result });
});
router.post('/social/like', protect, async (req, res) => {
  const Like = require('../models/Like');
  const result = await Like.toggle(req.user._id, req.tenantId, req.body.targetId, req.body.targetType);
  res.json({ success: true, data: { liked: result.liked } });
});

// Affiliate Routes
router.get('/affiliate/dashboard', protect, async (req, res) => {
  const Affiliate = require('../models/Affiliate');
  let affiliate = await Affiliate.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!affiliate) affiliate = await Affiliate.create({ userId: req.user._id, tenantId: req.tenantId });
  res.json({ success: true, data: { affiliate } });
});
router.post('/affiliate/register', protect, async (req, res) => {
  const Affiliate = require('../models/Affiliate');
  const existing = await Affiliate.findOne({ userId: req.user._id });
  if (existing) return res.status(409).json({ success: false, error: { message: 'Already registered as affiliate' } });
  const affiliate = await Affiliate.create({ ...req.body, userId: req.user._id, tenantId: req.tenantId });
  res.status(201).json({ success: true, data: { affiliate } });
});
router.get('/affiliate/commissions', protect, async (req, res) => {
  const Affiliate = require('../models/Affiliate');
  const AffiliateCommission = require('../models/AffiliateCommission');
  const affiliate = await Affiliate.findOne({ userId: req.user._id });
  if (!affiliate) return res.status(404).json({ success: false, error: { message: 'Affiliate not found' } });
  const commissions = await AffiliateCommission.find({ affiliateId: affiliate._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: { commissions } });
});
router.post('/affiliate/withdraw', protect, async (req, res) => {
  const Affiliate = require('../models/Affiliate');
  const AffiliateWithdrawal = require('../models/AffiliateWithdrawal');
  const affiliate = await Affiliate.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!affiliate) return res.status(404).json({ success: false, error: { message: 'Affiliate not found' } });
  if (req.body.amount > affiliate.currentBalance) return res.status(400).json({ success: false, error: { message: 'Insufficient balance' } });
  const withdrawal = await AffiliateWithdrawal.create({
    ...req.body, tenantId: req.tenantId, affiliateId: affiliate._id, userId: req.user._id,
  });
  affiliate.totalWithdrawn += withdrawal.amount;
  affiliate.currentBalance -= withdrawal.amount;
  await affiliate.save();
  res.status(201).json({ success: true, data: { withdrawal } });
});

module.exports = router;
