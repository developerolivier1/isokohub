const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Payment = require('../models/Payment');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');
const Notification = require('../models/Notification');
const Wallet = require('../models/Wallet');
const WalletTransaction = require('../models/WalletTransaction');
const VendorCommission = require('../models/VendorCommission');
const { AppError, asyncHandler } = require('../middleware/error');
const { sendOrderConfirmationEmail, sendOrderUpdate } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const logger = require('../utils/logger');

exports.createOrder = asyncHandler(async (req, res) => {
  const {
    items, shippingAddress, paymentMethod, couponCode, notes,
  } = req.body;

  if (!items || items.length === 0) throw new AppError('Cart is empty.', 400);
  if (!shippingAddress) throw new AppError('Shipping address required.', 400);

  let cartItems = items;
  if (!Array.isArray(items) && req.body.fromCart) {
    const cart = await Cart.findOne({ userId: req.user._id, tenantId: req.tenantId });
    if (!cart || cart.items.length === 0) throw new AppError('Cart is empty.', 400);
    cartItems = cart.items;
    await cart.clear();
  }

  const orderItems = [];
  let subtotal = 0;
  let totalDiscount = 0;
  let shippingFee = parseFloat(req.body.shippingFee) || 0;

  for (const item of cartItems) {
    const product = await Product.findById(item.productId);
    if (!product || product.status !== 'active') {
      throw new AppError(`Product ${item.productId} not found or inactive.`, 404);
    }
    if (product.tenantId.toString() !== req.tenantId.toString()) {
      throw new AppError('Invalid product for this tenant.', 400);
    }

    const itemPrice = item.variantId
      ? product.variants.find(v => v._id.toString() === item.variantId)?.price || product.price
      : product.price;

    const quantity = Math.max(1, item.quantity || 1);
    const itemSubtotal = itemPrice * quantity;
    const taxRate = product.taxRate || 0;
    const itemTax = itemSubtotal * (taxRate / 100);
    const commissionRate = product.vendorId?.commissionRate ||
      req.tenant?.commissionRate ||
      parseFloat(process.env.PLATFORM_COMMISSION_PERCENT) || 5;

    subtotal += itemSubtotal;

    orderItems.push({
      productId: product._id,
      vendorId: product.vendorId,
      name: product.name,
      sku: item.variantId
        ? product.variants.find(v => v._id.toString() === item.variantId)?.sku || product.sku
        : product.sku,
      image: product.images?.[0]?.url || '',
      variantId: item.variantId,
      variantName: item.name,
      price: itemPrice,
      quantity,
      subtotal: itemSubtotal,
      tax: itemTax,
      taxRate,
      discount: 0,
      total: itemSubtotal + itemTax,
      commissionRate,
      commissionAmount: itemSubtotal * (commissionRate / 100),
    });
  }

  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), tenantId: req.tenantId });
    if (coupon) {
      const validity = await coupon.isValid(req.user._id, subtotal);
      if (validity.valid) {
        couponDiscount = coupon.calculateDiscount(subtotal);
        coupon.usedCount += 1;
        await coupon.save();
      }
    }
  }

  const totalTax = orderItems.reduce((sum, item) => sum + item.tax, 0);
  const total = subtotal + shippingFee + totalTax - couponDiscount;

  const order = await Order.create({
    tenantId: req.tenantId,
    userId: req.user._id,
    items: orderItems,
    shippingAddress,
    billingAddress: req.body.billingAddress || shippingAddress,
    paymentMethod,
    subtotal,
    shippingFee,
    tax: totalTax,
    discount: couponDiscount,
    total,
    currency: req.tenant?.currency || 'RWF',
    coupon: couponCode ? { code: couponCode.toUpperCase(), discount: couponDiscount, type: 'fixed' } : undefined,
    notes,
    statusHistory: [{ status: 'pending', timestamp: new Date(), updatedBy: req.user._id }],
  });

  for (const item of orderItems) {
    const inventory = await Inventory.findOne({
      tenantId: req.tenantId,
      productId: item.productId,
      variantId: item.variantId || undefined,
    });
    if (inventory) {
      await inventory.decrement(item.quantity);
      await InventoryLog.create({
        tenantId: req.tenantId,
        inventoryId: inventory._id,
        productId: item.productId,
        type: 'sale',
        quantity: -item.quantity,
        quantityBefore: inventory.quantity + item.quantity,
        quantityAfter: inventory.quantity,
        reference: order.orderNumber,
        performedBy: req.user._id,
      });
    }

    await Product.findByIdAndUpdate(item.productId, { $inc: { totalSold: item.quantity } });

    await VendorCommission.create({
      vendorId: item.vendorId,
      tenantId: req.tenantId,
      orderId: order._id,
      productId: item.productId,
      amount: item.subtotal,
      commissionRate: item.commissionRate,
      commissionAmount: item.commissionAmount,
      netAmount: item.subtotal - item.commissionAmount,
      currency: req.tenant?.currency || 'RWF',
    });
  }

  for (const item of orderItems) {
    await Notification.create({
      tenantId: req.tenantId,
      userId: req.user._id,
      type: 'order_confirmed',
      title: 'Order Confirmed',
      message: `Your order #${order.orderNumber} has been placed successfully.`,
      data: { orderId: order._id, orderNumber: order.orderNumber },
      channels: { inApp: true, email: true },
    });
  }

  try {
    await sendOrderConfirmationEmail(req.user, order);
  } catch (e) { logger.warn(`Order email failed: ${e.message}`); }

  res.status(201).json({ success: true, data: { order } });
});

exports.getOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  const filter = { tenantId: req.tenantId };

  if (req.user.role === 'customer') filter.userId = req.user._id;
  if (req.user.role === 'vendor') {
    const vendor = await Vendor.findOne({ userId: req.user._id });
    if (vendor) filter['items.vendorId'] = vendor._id;
  }

  if (status) filter.status = status;
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
    Order.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    },
  });
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    tenantId: req.tenantId,
  }).populate('userId', 'name email phone address');

  if (!order) throw new AppError('Order not found.', 404);

  if (req.user.role === 'customer' && order.userId._id.toString() !== req.user._id.toString()) {
    throw new AppError('Not authorized.', 403);
  }

  res.json({ success: true, data: { order } });
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!order) throw new AppError('Order not found.', 404);

  await order.updateStatus(status, req.user._id, note);

  const statusMessages = {
    confirmed: 'Your order has been confirmed.',
    processing: 'Your order is being processed.',
    packed: 'Your order has been packed.',
    shipped: 'Your order has been shipped!',
    out_for_delivery: 'Your order is out for delivery!',
    delivered: 'Your order has been delivered. Enjoy!',
    cancelled: 'Your order has been cancelled.',
  };

  if (status === 'delivered') {
    const payment = await Payment.findOne({ orderId: order._id });
    if (payment && payment.status === 'paid') {
      const commissions = await VendorCommission.find({ orderId: order._id, status: 'pending' });
      for (const commission of commissions) {
        commission.status = 'calculated';
        await commission.save();
        const vendorWallet = await Wallet.findOne({ userId: commission.vendorId });
        if (vendorWallet) {
          await vendorWallet.credit(commission.netAmount, `Sale: ${order.orderNumber}`);
          await WalletTransaction.create({
            walletId: vendorWallet._id,
            userId: commission.vendorId,
            tenantId: req.tenantId,
            type: 'commission',
            amount: commission.netAmount,
            balanceBefore: vendorWallet.balance - commission.netAmount,
            balanceAfter: vendorWallet.balance,
            reference: `COM-${commission._id}`,
            description: `Commission for order ${order.orderNumber}`,
            relatedOrderId: order._id,
          });
        }
      }
    }
  }

  await Notification.create({
    tenantId: req.tenantId,
    userId: order.userId,
    type: `order_${status}`,
    title: `Order ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: statusMessages[status] || `Order status updated to ${status}`,
    data: { orderId: order._id, orderNumber: order.orderNumber, status },
    channels: { inApp: true, email: true, sms: true },
  });

  res.json({ success: true, data: { order } });
});

exports.cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId });
  if (!order) throw new AppError('Order not found.', 404);

  if (!['pending', 'confirmed'].includes(order.status)) {
    throw new AppError('Order cannot be cancelled at this stage.', 400);
  }

  await order.updateStatus('cancelled', req.user._id, reason);

  for (const item of order.items) {
    const inventory = await Inventory.findOne({
      tenantId: req.tenantId,
      productId: item.productId,
      variantId: item.variantId,
    });
    if (inventory) {
      await inventory.increment(item.quantity);
    }
    await Product.findByIdAndUpdate(item.productId, { $inc: { totalSold: -item.quantity } });
  }

  if (order.paymentId) {
    const payment = await Payment.findById(order.paymentId);
    if (payment && payment.status === 'paid') {
      await payment.refund(order.total, 'Order cancelled', req.user._id);
    }
  }

  res.json({ success: true, data: { order } });
});

exports.getOrderStatusHistory = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, tenantId: req.tenantId })
    .select('statusHistory orderNumber status');
  if (!order) throw new AppError('Order not found.', 404);
  res.json({ success: true, data: { statusHistory: order.statusHistory, timeline: order.getStatusTimeline() } });
});
