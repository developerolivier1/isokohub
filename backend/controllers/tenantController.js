const Tenant = require('../models/Tenant');
const TenantSetting = require('../models/TenantSetting');
const CustomDomain = require('../models/CustomDomain');
const Subscription = require('../models/Subscription');
const { AppError, asyncHandler } = require('../middleware/error');

exports.getTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.tenantId);
  if (!tenant) throw new AppError('Tenant not found.', 404);
  res.json({ success: true, data: { tenant } });
});

exports.updateTenant = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'logo', 'favicon', 'primaryColor', 'secondaryColor', 'currency', 'country', 'timezone', 'language', 'commissionRate', 'meta'];
  const updates = {};
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const tenant = await Tenant.findByIdAndUpdate(req.tenantId, updates, { new: true, runValidators: true });
  if (!tenant) throw new AppError('Tenant not found.', 404);
  res.json({ success: true, data: { tenant } });
});

exports.getTenantSettings = asyncHandler(async (req, res) => {
  const settings = await TenantSetting.find({ tenantId: req.tenantId });
  res.json({ success: true, data: { settings } });
});

exports.updateTenantSetting = asyncHandler(async (req, res) => {
  const { key, value, category } = req.body;
  const setting = await TenantSetting.setSetting(req.tenantId, key, value, category);
  res.json({ success: true, data: { setting } });
});

exports.getDomainSettings = asyncHandler(async (req, res) => {
  const domains = await CustomDomain.find({ tenantId: req.tenantId });
  res.json({ success: true, data: { domains } });
});

exports.addDomain = asyncHandler(async (req, res) => {
  const { domain } = req.body;
  const existing = await CustomDomain.findOne({ domain });
  if (existing) throw new AppError('Domain already registered.', 409);

  const customDomain = await CustomDomain.create({
    tenantId: req.tenantId,
    domain,
    isPrimary: req.body.isPrimary || false,
  });

  res.status(201).json({ success: true, data: { customDomain } });
});

exports.verifyDomain = asyncHandler(async (req, res) => {
  const customDomain = await CustomDomain.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!customDomain) throw new AppError('Domain not found.', 404);

  const verified = await customDomain.verify();
  await customDomain.save();

  res.json({ success: true, data: { verified, domain: customDomain } });
});

exports.removeDomain = asyncHandler(async (req, res) => {
  const domain = await CustomDomain.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!domain) throw new AppError('Domain not found.', 404);
  res.json({ success: true, data: { message: 'Domain removed' } });
});

exports.getSubscription = asyncHandler(async (req, res) => {
  const subscription = await Subscription.findOne({ tenantId: req.tenantId });
  if (!subscription) throw new AppError('No subscription found.', 404);
  res.json({ success: true, data: { subscription } });
});

exports.updateSubscription = asyncHandler(async (req, res) => {
  const { plan, billingCycle } = req.body;
  const subscription = await Subscription.findOne({ tenantId: req.tenantId });
  if (!subscription) throw new AppError('Subscription not found.', 404);

  const prices = {
    basic: { monthly: 0, yearly: 0 },
    professional: { monthly: 29000, yearly: 290000 },
    enterprise: { monthly: 99000, yearly: 990000 },
  };

  subscription.plan = plan;
  subscription.billingCycle = billingCycle;
  subscription.price = prices[plan]?.[billingCycle] || 0;
  subscription.currentPeriodEnd = new Date(Date.now() + (billingCycle === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
  subscription.status = 'active';
  await subscription.save();

  const tenant = await Tenant.findById(req.tenantId);
  tenant.plan = plan;
  await tenant.save();

  res.json({ success: true, data: { subscription } });
});

exports.getTenantStats = asyncHandler(async (req, res) => {
  const [vendors, products, orders, revenue] = await Promise.all([
    mongoose.model('Vendor').countDocuments({ tenantId: req.tenantId }),
    mongoose.model('Product').countDocuments({ tenantId: req.tenantId, status: 'active' }),
    mongoose.model('Order').countDocuments({ tenantId: req.tenantId }),
    mongoose.model('Order').aggregate([
      { $match: { tenantId: req.tenantId, status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      stats: {
        totalVendors: vendors,
        totalProducts: products,
        totalOrders: orders,
        totalRevenue: revenue[0]?.total || 0,
      },
    },
  });
});

const mongoose = require('mongoose');
