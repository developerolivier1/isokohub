const LiveStream = require('../models/LiveStream');
const LiveStreamProduct = require('../models/LiveStreamProduct');
const LiveStreamComment = require('../models/LiveStreamComment');
const LiveStreamReaction = require('../models/LiveStreamReaction');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const { AppError, asyncHandler } = require('../middleware/error');

exports.createLiveStream = asyncHandler(async (req, res) => {
  const vendor = await Vendor.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!vendor) throw new AppError('Vendor profile not found.', 404);

  const streamKey = require('crypto').randomBytes(16).toString('hex');
  const liveStream = await LiveStream.create({
    ...req.body,
    tenantId: req.tenantId,
    vendorId: vendor._id,
    hostId: req.user._id,
    streamKey,
    rtmpUrl: `rtmp://stream.isokohub.com/live/${streamKey}`,
  });

  res.status(201).json({ success: true, data: { liveStream } });
});

exports.getLiveStreams = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = { tenantId: req.tenantId };

  if (status) filter.status = status;
  else filter.status = { $in: ['live', 'scheduled'] };

  if (req.user && req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (vendor) filter.vendorId = vendor._id;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [streams, total] = await Promise.all([
    LiveStream.find(filter)
      .populate('vendorId', 'storeName storeLogo')
      .populate('hostId', 'name avatar')
      .sort({ scheduledAt: -1 }).skip(skip).limit(parseInt(limit)),
    LiveStream.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      streams,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    },
  });
});

exports.getLiveStream = asyncHandler(async (req, res) => {
  const stream = await LiveStream.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate('vendorId', 'storeName storeLogo storeSlug')
    .populate('hostId', 'name avatar');

  if (!stream) throw new AppError('Live stream not found.', 404);

  const products = await LiveStreamProduct.find({ liveStreamId: stream._id })
    .populate('productId', 'name price images');

  const comments = await LiveStreamComment.find({ liveStreamId: stream._id })
    .populate('userId', 'name avatar')
    .sort({ createdAt: -1 }).limit(50);

  res.json({ success: true, data: { stream, products, comments } });
});

exports.updateLiveStream = asyncHandler(async (req, res) => {
  const stream = await LiveStream.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!stream) throw new AppError('Live stream not found.', 404);
  Object.assign(stream, req.body);
  await stream.save();
  res.json({ success: true, data: { stream } });
});

exports.startLiveStream = asyncHandler(async (req, res) => {
  const stream = await LiveStream.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!stream) throw new AppError('Live stream not found.', 404);
  await stream.startStream();
  res.json({ success: true, data: { stream } });
});

exports.endLiveStream = asyncHandler(async (req, res) => {
  const stream = await LiveStream.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!stream) throw new AppError('Live stream not found.', 404);
  await stream.endStream();
  res.json({ success: true, data: { stream } });
});

exports.addProductToStream = asyncHandler(async (req, res) => {
  const { productId, specialPrice, quantity } = req.body;
  const product = await Product.findOne({ _id: productId, tenantId: req.tenantId });
  if (!product) throw new AppError('Product not found.', 404);

  const lp = await LiveStreamProduct.create({
    tenantId: req.tenantId,
    liveStreamId: req.params.id,
    productId,
    specialPrice: specialPrice || product.price,
    originalPrice: product.price,
    quantity: quantity || 0,
  });

  res.status(201).json({ success: true, data: { liveStreamProduct: lp } });
});

exports.removeProductFromStream = asyncHandler(async (req, res) => {
  const lp = await LiveStreamProduct.findOneAndDelete({
    _id: req.params.productId,
    liveStreamId: req.params.id,
  });
  if (!lp) throw new AppError('Product not found in stream.', 404);
  res.json({ success: true, data: { message: 'Product removed from stream' } });
});

exports.addComment = asyncHandler(async (req, res) => {
  const comment = await LiveStreamComment.create({
    tenantId: req.tenantId,
    liveStreamId: req.params.id,
    userId: req.user._id,
    message: req.body.message,
  });
  res.status(201).json({ success: true, data: { comment } });
});

exports.addReaction = asyncHandler(async (req, res) => {
  const { type } = req.body;
  const reaction = await LiveStreamReaction.create({
    tenantId: req.tenantId,
    liveStreamId: req.params.id,
    userId: req.user._id,
    type,
  });

  const stream = await LiveStream.findById(req.params.id);
  if (stream) {
    const key = type === 'like' ? 'likes' : type === 'heart' ? 'hearts' : type === 'share' ? 'shares' : null;
    if (key) {
      stream.reactions[key] += 1;
      await stream.save();
    }
  }

  res.status(201).json({ success: true, data: { reaction } });
});
