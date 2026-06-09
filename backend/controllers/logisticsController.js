const Warehouse = require('../models/Warehouse');
const WarehouseInventory = require('../models/WarehouseInventory');
const WarehouseTransfer = require('../models/WarehouseTransfer');
const DeliveryPartner = require('../models/DeliveryPartner');
const DeliveryDriver = require('../models/DeliveryDriver');
const DeliveryRoute = require('../models/DeliveryRoute');
const DeliveryTracking = require('../models/DeliveryTracking');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const { AppError, asyncHandler } = require('../middleware/error');

exports.createWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.create({ ...req.body, tenantId: req.tenantId });
  res.status(201).json({ success: true, data: { warehouse } });
});

exports.getWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find({ tenantId: req.tenantId, isActive: true });
  res.json({ success: true, data: { warehouses } });
});

exports.getAllWarehouses = asyncHandler(async (req, res) => {
  const warehouses = await Warehouse.find({ tenantId: req.tenantId });
  res.json({ success: true, data: { warehouses } });
});

exports.getWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!warehouse) throw new AppError('Warehouse not found.', 404);
  res.json({ success: true, data: { warehouse } });
});

exports.updateWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!warehouse) throw new AppError('Warehouse not found.', 404);
  res.json({ success: true, data: { warehouse } });
});

exports.deleteWarehouse = asyncHandler(async (req, res) => {
  const warehouse = await Warehouse.findOneAndUpdate(
    { _id: req.params.id, tenantId: req.tenantId },
    { isActive: false },
    { new: true }
  );
  if (!warehouse) throw new AppError('Warehouse not found.', 404);
  res.json({ success: true, data: { message: 'Warehouse deactivated' } });
});

exports.getWarehouseInventory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const filter = { tenantId: req.tenantId, warehouseId: req.params.id };
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [inventory, total] = await Promise.all([
    WarehouseInventory.find(filter).populate('productId', 'name sku price').skip(skip).limit(parseInt(limit)),
    WarehouseInventory.countDocuments(filter),
  ]);
  res.json({ success: true, data: { inventory, pagination: { page: parseInt(page), limit: parseInt(limit), total } } });
});

exports.updateWarehouseInventory = asyncHandler(async (req, res) => {
  const { productId, quantity, minStockLevel, maxStockLevel } = req.body;
  const inventory = await WarehouseInventory.findOneAndUpdate(
    { tenantId: req.tenantId, warehouseId: req.params.id, productId },
    { quantity, minStockLevel, maxStockLevel },
    { upsert: true, new: true, runValidators: true }
  );
  res.json({ success: true, data: { inventory } });
});

exports.createTransfer = asyncHandler(async (req, res) => {
  const transfer = await WarehouseTransfer.create({
    ...req.body,
    tenantId: req.tenantId,
    initiatedBy: req.user._id,
  });
  res.status(201).json({ success: true, data: { transfer } });
});

exports.getTransfers = asyncHandler(async (req, res) => {
  const transfers = await WarehouseTransfer.find({ tenantId: req.tenantId })
    .populate('fromWarehouseId', 'name code')
    .populate('toWarehouseId', 'name code')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: { transfers } });
});

exports.approveTransfer = asyncHandler(async (req, res) => {
  const transfer = await WarehouseTransfer.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!transfer) throw new AppError('Transfer not found.', 404);
  transfer.status = 'approved';
  transfer.approvedBy = req.user._id;
  transfer.approvedAt = new Date();
  await transfer.save();
  res.json({ success: true, data: { transfer } });
});

exports.completeTransfer = asyncHandler(async (req, res) => {
  const transfer = await WarehouseTransfer.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!transfer) throw new AppError('Transfer not found.', 404);

  for (const item of transfer.items) {
    const fromInv = await WarehouseInventory.findOne({
      tenantId: req.tenantId,
      warehouseId: transfer.fromWarehouseId,
      productId: item.productId,
    });
    if (fromInv) {
      fromInv.quantity -= item.quantity;
      await fromInv.save();
    }

    const toInv = await WarehouseInventory.findOneAndUpdate(
      { tenantId: req.tenantId, warehouseId: transfer.toWarehouseId, productId: item.productId },
      { $inc: { quantity: item.quantity } },
      { upsert: true, new: true }
    );
  }

  transfer.status = 'completed';
  transfer.completedAt = new Date();
  await transfer.save();

  res.json({ success: true, data: { transfer } });
});

exports.getNearestWarehouse = asyncHandler(async (req, res) => {
  const { longitude, latitude, maxDistance = 50000 } = req.query;
  if (!longitude || !latitude) throw new AppError('Coordinates required.', 400);

  const warehouses = await Warehouse.findNearest(
    [parseFloat(longitude), parseFloat(latitude)],
    parseInt(maxDistance)
  );
  res.json({ success: true, data: { warehouses } });
});

exports.createDeliveryPartner = asyncHandler(async (req, res) => {
  const partner = await DeliveryPartner.create({ ...req.body, tenantId: req.tenantId });
  res.status(201).json({ success: true, data: { partner } });
});

exports.getDeliveryPartners = asyncHandler(async (req, res) => {
  const partners = await DeliveryPartner.find({ tenantId: req.tenantId });
  res.json({ success: true, data: { partners } });
});

exports.registerDriver = asyncHandler(async (req, res) => {
  const driver = await DeliveryDriver.create({
    ...req.body,
    tenantId: req.tenantId,
    userId: req.user._id,
  });
  res.status(201).json({ success: true, data: { driver } });
});

exports.getDrivers = asyncHandler(async (req, res) => {
  const { isOnline, status } = req.query;
  const filter = { tenantId: req.tenantId };
  if (isOnline !== undefined) filter.isOnline = isOnline === 'true';
  if (status) filter.status = status;

  const drivers = await DeliveryDriver.find(filter)
    .populate('userId', 'name email phone');
  res.json({ success: true, data: { drivers } });
});

exports.getDriver = asyncHandler(async (req, res) => {
  const driver = await DeliveryDriver.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .populate('userId', 'name email phone');
  if (!driver) throw new AppError('Driver not found.', 404);
  res.json({ success: true, data: { driver } });
});

exports.updateDriverLocation = asyncHandler(async (req, res) => {
  const { longitude, latitude, isOnline } = req.body;
  const driver = await DeliveryDriver.findOne({ userId: req.user._id, tenantId: req.tenantId });
  if (!driver) throw new AppError('Driver not found.', 404);

  driver.currentLocation.coordinates = [parseFloat(longitude), parseFloat(latitude)];
  if (isOnline !== undefined) driver.isOnline = isOnline;
  driver.lastActiveAt = new Date();
  await driver.save();

  res.json({ success: true, data: { driver } });
});

exports.assignDelivery = asyncHandler(async (req, res) => {
  const { orderId, driverId } = req.body;
  const order = await Order.findOne({ _id: orderId, tenantId: req.tenantId });
  if (!order) throw new AppError('Order not found.', 404);

  const driver = await DeliveryDriver.findOne({ _id: driverId, tenantId: req.tenantId });
  if (!driver) throw new AppError('Driver not found.', 404);

  order.deliveryDriverId = driver._id;
  order.status = 'shipped';
  order.statusHistory.push({ status: 'shipped', timestamp: new Date(), updatedBy: req.user._id, note: `Assigned to driver: ${driver.fullName}` });
  await order.save();

  driver.currentOrderId = order._id;
  driver.isAvailable = false;
  await driver.save();

  const tracking = await DeliveryTracking.create({
    tenantId: req.tenantId,
    orderId: order._id,
    driverId: driver._id,
    status: 'assigned',
    estimatedDeliveryTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
    otpCode: Math.floor(100000 + Math.random() * 900000).toString(),
  });

  res.json({ success: true, data: { order, tracking } });
});

exports.getTracking = asyncHandler(async (req, res) => {
  const tracking = await DeliveryTracking.findOne({
    orderId: req.params.orderId,
    tenantId: req.tenantId,
  }).populate('driverId', 'fullName phone vehicle currentLocation');
  if (!tracking) throw new AppError('Tracking not found.', 404);
  res.json({ success: true, data: { tracking } });
});

exports.updateDeliveryStatus = asyncHandler(async (req, res) => {
  const { status, longitude, latitude } = req.body;
  const tracking = await DeliveryTracking.findOne({
    orderId: req.params.orderId,
    tenantId: req.tenantId,
  });
  if (!tracking) throw new AppError('Tracking not found.', 404);

  tracking.status = status;
  if (longitude && latitude) {
    tracking.location.coordinates = [parseFloat(longitude), parseFloat(latitude)];
  }

  if (status === 'delivered') {
    tracking.actualDeliveryTime = new Date();
    await Order.findOneAndUpdate(
      { _id: req.params.orderId },
      { status: 'delivered', 'deliveryTracking.actualDelivery': new Date() }
    );
  }

  await tracking.save();
  res.json({ success: true, data: { tracking } });
});

exports.verifyDeliveryOTP = asyncHandler(async (req, res) => {
  const { otp } = req.body;
  const tracking = await DeliveryTracking.findOne({
    orderId: req.params.orderId,
    tenantId: req.tenantId,
  });
  if (!tracking) throw new AppError('Tracking not found.', 404);

  if (tracking.otpCode !== otp) throw new AppError('Invalid OTP.', 400);

  tracking.otpVerified = true;
  tracking.otpVerifiedAt = new Date();
  tracking.status = 'delivered';
  tracking.actualDeliveryTime = new Date();
  await tracking.save();

  await Order.findOneAndUpdate(
    { _id: req.params.orderId },
    { status: 'delivered', 'deliveryTracking.otpVerified': true }
  );

  res.json({ success: true, data: { message: 'Delivery verified successfully' } });
});

exports.getLowStockAlert = asyncHandler(async (req, res) => {
  const lowStock = await WarehouseInventory.find({
    tenantId: req.tenantId,
    $expr: { $lte: ['$quantity', '$minStockLevel'] },
  }).populate('productId', 'name sku price').populate('warehouseId', 'name');

  res.json({ success: true, data: { lowStock } });
});
