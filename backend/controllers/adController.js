const Advertisement = require('../models/Advertisement');
const AdCampaign = require('../models/AdCampaign');
const AdClick = require('../models/AdClick');
const AdImpression = require('../models/AdImpression');
const Vendor = require('../models/Vendor');
const { AppError, asyncHandler } = require('../middleware/error');

exports.createAd = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!vendor) throw new AppError('Vendor profile not found.', 404);

  const ad = await Advertisement.create({
    ...req.body,
    tenantId: req.tenantId,
    vendorId: vendor._id,
  });

  res.status(201).json({ success: true, data: { ad } });
});

exports.getAds = asyncHandler(async (req, res) => {
  const { status, placement, page = 1, limit = 20 } = req.query;
  const filter = { tenantId: req.tenantId };

  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (vendor) filter.vendorId = vendor._id;
  }

  if (status) filter.status = status;
  if (placement) filter.placement = placement;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [ads, total] = await Promise.all([
    Advertisement.find(filter).populate('vendorId', 'storeName').sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Advertisement.countDocuments(filter),
  ]);

  res.json({ success: true, data: { ads, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } } });
});

exports.getAd = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!ad) throw new AppError('Ad not found.', 404);
  res.json({ success: true, data: { ad } });
});

exports.updateAd = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!ad) throw new AppError('Ad not found.', 404);
  Object.assign(ad, req.body);
  await ad.save();
  res.json({ success: true, data: { ad } });
});

exports.deleteAd = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });
  if (!ad) throw new AppError('Ad not found.', 404);
  res.json({ success: true, data: { message: 'Ad deleted' } });
});

exports.pauseAd = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!ad) throw new AppError('Ad not found.', 404);
  ad.status = 'paused';
  ad.isActive = false;
  await ad.save();
  res.json({ success: true, data: { ad } });
});

exports.resumeAd = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!ad) throw new AppError('Ad not found.', 404);
  ad.status = 'active';
  ad.isActive = true;
  await ad.save();
  res.json({ success: true, data: { ad } });
});

exports.getPlacementAds = asyncHandler(async (req, res) => {
  const { placement, limit = 3 } = req.query;
  if (!placement) throw new AppError('Placement is required.', 400);

  const ads = await Advertisement.find({
    tenantId: req.tenantId,
    placement,
    isActive: true,
    status: 'active',
    'schedule.startDate': { $lte: new Date() },
    'schedule.endDate': { $gte: new Date() },
  }).populate('vendorId', 'storeName').limit(parseInt(limit));

  for (const ad of ads) {
    await AdImpression.create({
      tenantId: req.tenantId,
      adId: ad._id,
      campaignId: ad.campaignId,
    });
    ad.metrics.impressions += 1;
    ad.spent += ad.bidType === 'cpm' ? ad.bidAmount / 1000 : 0;
    ad.metrics.spend = ad.spent;
    await ad.save();
  }

  res.json({ success: true, data: { ads } });
});

exports.trackClick = asyncHandler(async (req, res) => {
  const ad = await Advertisement.findById(req.params.id);
  if (!ad) throw new AppError('Ad not found.', 404);

  await AdClick.create({
    tenantId: ad.tenantId,
    adId: ad._id,
    campaignId: ad.campaignId,
    userId: req.user?._id,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    referrer: req.headers.referer,
    cost: ad.bidType === 'cpc' ? ad.bidAmount : 0,
  });

  ad.metrics.clicks += 1;
  ad.metrics.ctr = (ad.metrics.clicks / ad.metrics.impressions) * 100;
  ad.spent += ad.bidType === 'cpc' ? ad.bidAmount : 0;
  ad.metrics.spend = ad.spent;
  ad.metrics.cpc = ad.metrics.clicks > 0 ? ad.spent / ad.metrics.clicks : 0;
  await ad.save();

  res.json({ success: true, data: { redirectUrl: ad.targetUrl || ad.content.linkUrl } });
});

exports.createCampaign = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!vendor) throw new AppError('Vendor profile not found.', 404);

  const campaign = await AdCampaign.create({
    ...req.body,
    tenantId: req.tenantId,
    vendorId: vendor._id,
    createdBy: req.user._id,
  });

  res.status(201).json({ success: true, data: { campaign } });
});

exports.getCampaigns = asyncHandler(async (req, res) => {
  const filter = { tenantId: req.tenantId };
  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (vendor) filter.vendorId = vendor._id;
  }

  const campaigns = await AdCampaign.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, data: { campaigns } });
});

exports.getCampaign = asyncHandler(async (req, res) => {
  const campaign = await AdCampaign.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate('ads');
  if (!campaign) throw new AppError('Campaign not found.', 404);
  res.json({ success: true, data: { campaign } });
});

exports.updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await AdCampaign.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!campaign) throw new AppError('Campaign not found.', 404);
  Object.assign(campaign, req.body);
  await campaign.save();
  res.json({ success: true, data: { campaign } });
});

exports.getAdAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const dateFilter = { tenantId: req.tenantId };
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  const [impressions, clicks, adStats] = await Promise.all([
    AdImpression.countDocuments(dateFilter),
    AdClick.countDocuments(dateFilter),
    Advertisement.aggregate([
      { $match: { tenantId: req.tenantId } },
      { $group: { _id: null, totalSpent: { $sum: '$spent' }, totalImpressions: { $sum: '$metrics.impressions' }, totalClicks: { $sum: '$metrics.clicks' }, totalConversions: { $sum: '$metrics.conversions' } } },
    ]),
  ]);

  const stats = adStats[0] || { totalSpent: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 };

  res.json({
    success: true,
    data: {
      analytics: {
        ...stats,
        ctr: stats.totalImpressions > 0 ? (stats.totalClicks / stats.totalImpressions) * 100 : 0,
        cpc: stats.totalClicks > 0 ? stats.totalSpent / stats.totalClicks : 0,
        cpm: stats.totalImpressions > 0 ? (stats.totalSpent / stats.totalImpressions) * 1000 : 0,
        periodImpressions: impressions,
        periodClicks: clicks,
      },
    },
  });
});
