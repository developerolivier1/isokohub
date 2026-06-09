const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Payment = require('../models/Payment');
const { AppError, asyncHandler } = require('../middleware/error');
const { generateReportExcel, generateInvoicePDF } = require('../utils/pdfGenerator');
const logger = require('../utils/logger');

exports.getSalesReport = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day', vendorId } = req.query;
  const match = { tenantId: req.tenantId };

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }
  if (vendorId) match['items.vendorId'] = vendorId;

  let dateFormat;
  if (groupBy === 'day') dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  else if (groupBy === 'week') dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt' } };
  else if (groupBy === 'month') dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  else dateFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };

  const salesData = await Order.aggregate([
    { $match: match },
    { $group: { _id: dateFormat, totalSales: { $sum: 1 }, totalRevenue: { $sum: '$total' }, totalSubtotal: { $sum: '$subtotal' }, totalShipping: { $sum: '$shippingFee' }, totalTax: { $sum: '$tax' }, totalDiscount: { $sum: '$discount' } } },
    { $sort: { _id: 1 } },
  ]);

  const totals = await Order.aggregate([
    { $match: match },
    { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$total' }, avgOrderValue: { $avg: '$total' } } },
  ]);

  const statusBreakdown = await Order.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: { salesData, totals: totals[0] || { totalOrders: 0, totalRevenue: 0, avgOrderValue: 0 }, statusBreakdown },
  });
});

exports.getProductReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = { tenantId: req.tenantId };

  const productPerformance = await Order.aggregate([
    { $match: match },
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', productName: { $first: '$items.name' }, totalSold: { $sum: '$items.quantity' }, totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, orderCount: { $sum: 1 } } },
    { $sort: { totalSold: -1 } },
    { $limit: 50 },
  ]);

  const topVendors = await Vendor.find({ tenantId: req.tenantId })
    .sort({ totalSales: -1 }).limit(10).select('storeName totalSales totalRevenue ratings');

  const categoryBreakdown = await Product.aggregate([
    { $match: { tenantId: req.tenantId, status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
  ]);

  res.json({ success: true, data: { productPerformance, topVendors, categoryBreakdown } });
});

exports.getRevenueReport = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const match = { tenantId: req.tenantId };
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const revenue = await Payment.aggregate([
    { $match: { ...match, status: 'paid' } },
    { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 }, fees: { $sum: '$fee' }, net: { $sum: '$netAmount' } } },
  ]);

  const dailyRevenue = await Payment.aggregate([
    { $match: { ...match, status: 'paid' } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  res.json({ success: true, data: { revenue, dailyRevenue } });
});

exports.getCustomerReport = asyncHandler(async (req, res) => {
  const userCount = await User.countDocuments({ tenantId: req.tenantId, role: 'customer' });

  const topCustomers = await Order.aggregate([
    { $match: { tenantId: req.tenantId } },
    { $group: { _id: '$userId', totalOrders: { $sum: 1 }, totalSpent: { $sum: '$total' }, avgOrderValue: { $avg: '$total' } } },
    { $sort: { totalSpent: -1 } },
    { $limit: 20 },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
    { $project: { totalOrders: 1, totalSpent: 1, avgOrderValue: 1, 'user.name': 1, 'user.email': 1 } },
  ]);

  res.json({ success: true, data: { totalCustomers: userCount, topCustomers } });
});

exports.downloadReport = asyncHandler(async (req, res) => {
  const { type, startDate, endDate, format = 'xlsx' } = req.query;
  if (!type) throw new AppError('Report type is required.', 400);

  let data;
  let headers;
  let title;

  if (type === 'sales') {
    title = 'Sales Report';
    headers = [{ key: 'date', label: 'Date', width: 15 }, { key: 'orders', label: 'Orders', width: 12 }, { key: 'revenue', label: 'Revenue', width: 15 }, { key: 'shipping', label: 'Shipping', width: 12 }, { key: 'tax', label: 'Tax', width: 12 }, { key: 'discount', label: 'Discount', width: 12 }];
    const salesData = await Order.aggregate([
      { $match: { tenantId: req.tenantId, createdAt: { $gte: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), $lte: endDate ? new Date(endDate) : new Date() } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, orders: { $sum: 1 }, revenue: { $sum: '$total' }, shipping: { $sum: '$shippingFee' }, tax: { $sum: '$tax' }, discount: { $sum: '$discount' } } },
      { $sort: { _id: 1 } },
    ]);
    data = salesData.map(d => [d._id, d.orders, d.revenue, d.shipping, d.tax, d.discount]);
  } else if (type === 'products') {
    title = 'Product Performance';
    headers = [{ key: 'name', label: 'Product Name', width: 30 }, { key: 'sold', label: 'Units Sold', width: 12 }, { key: 'revenue', label: 'Revenue', width: 15 }];
    const products = await Order.aggregate([
      { $match: { tenantId: req.tenantId } },
      { $unwind: '$items' },
      { $group: { _id: '$items.name', sold: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { sold: -1 } },
      { $limit: 100 },
    ]);
    data = products.map(p => [p._id, p.sold, p.revenue]);
  } else {
    throw new AppError('Invalid report type.', 400);
  }

  const filePath = await generateReportExcel({ title, headers, rows: data });

  res.download(filePath, `${type}_report_${Date.now()}.xlsx`, (err) => {
    if (err) {
      logger.error(`Report download error: ${err.message}`);
      throw new AppError('Failed to download report.', 500);
    }
  });
});

exports.downloadInvoice = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.orderId, tenantId: req.tenantId })
    .populate('userId', 'name email')
    .populate('tenantId', 'name');

  if (!order) throw new AppError('Order not found.', 404);

  const filePath = await generateInvoicePDF(order);
  res.download(filePath, `invoice_${order.orderNumber}.pdf`);
});

exports.getDashboardStats = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const [totalOrders, totalRevenue, totalProducts, totalVendors, totalCustomers, monthOrders, monthRevenue, recentOrders] = await Promise.all([
    Order.countDocuments({ tenantId: req.tenantId }),
    Order.aggregate([{ $match: { tenantId: req.tenantId, status: 'delivered' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Product.countDocuments({ tenantId: req.tenantId, status: 'active' }),
    Vendor.countDocuments({ tenantId: req.tenantId, status: 'verified' }),
    User.countDocuments({ tenantId: req.tenantId, role: 'customer' }),
    Order.countDocuments({ tenantId: req.tenantId, createdAt: { $gte: startOfMonth } }),
    Order.aggregate([{ $match: { tenantId: req.tenantId, createdAt: { $gte: startOfMonth } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.find({ tenantId: req.tenantId }).sort({ createdAt: -1 }).limit(5).populate('userId', 'name'),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalProducts,
        totalVendors,
        totalCustomers,
        monthOrders,
        monthRevenue: monthRevenue[0]?.total || 0,
      },
      recentOrders,
    },
  });
});
