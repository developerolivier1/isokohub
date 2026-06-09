const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { connectDB } = require('../config/db');
const logger = require('../utils/logger');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

const seedOrders = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB for order seeding...');

    const tenant = await Tenant.findOne({ slug: 'isokohub' });
    if (!tenant) {
      logger.error('No tenant found. Run seed:tenants first.');
      process.exit(1);
    }

    const customer = await User.findOne({ email: 'customer@isokohub.com' });
    const vendor = await Vendor.findOne({ tenantId: tenant._id });
    if (!customer || !vendor) {
      logger.error('Missing users or vendor. Run seed:users and seed:products first.');
      process.exit(1);
    }

    const vendorUser = await User.findById(vendor.userId);
    const products = await Product.find({ tenantId: tenant._id, vendorId: vendor._id });

    await Order.deleteMany({});
    await Payment.deleteMany({});
    logger.info('Cleared existing orders and payments');

    const now = new Date();
    const orderData = [
      {
        orderNumber: 'ORD-2025-001',
        status: 'delivered',
        items: [
          { productId: products[0]._id, variantId: products[0].variants?.[0]?._id, name: products[0].name, sku: products[0].variants?.[0]?.sku || products[0].sku, price: products[0].price, quantity: 1, image: products[0].images?.[0]?.url },
          { productId: products[4]._id, variantId: products[4].variants?.[0]?._id, name: products[4].name, sku: products[4].variants?.[0]?.sku || products[4].sku, price: products[4].price, quantity: 2, image: products[4].images?.[0]?.url },
        ],
        subtotal: products[0].price + products[4].price * 2,
        shipping: 5000, tax: 0, discount: 0, total: products[0].price + products[4].price * 2 + 5000,
        currency: 'RWF',
        shippingAddress: { street: 'KG 5 Ave', city: 'Kigali', country: 'RW', fullName: 'Jane Customer', phone: '+250788400000' },
        paymentMethod: 'card', paymentStatus: 'paid',
        deliveredAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'ORD-2025-002',
        status: 'shipped',
        items: [
          { productId: products[2]._id, variantId: products[2].variants?.[0]?._id, name: products[2].name, sku: products[2].variants?.[0]?.sku || products[2].sku, price: products[2].price, quantity: 1, image: products[2].images?.[0]?.url },
        ],
        subtotal: products[2].price,
        shipping: 10000, tax: 0, discount: 0, total: products[2].price + 10000,
        currency: 'RWF',
        shippingAddress: { street: 'KG 5 Ave', city: 'Kigali', country: 'RW', fullName: 'Jane Customer', phone: '+250788400000' },
        paymentMethod: 'wallet', paymentStatus: 'paid',
        shippedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
        trackingNumber: 'KGL-DHL-2025-78901',
        createdAt: new Date(now - 4 * 24 * 60 * 60 * 1000),
      },
      {
        orderNumber: 'ORD-2025-003',
        status: 'confirmed',
        items: [
          { productId: products[5]._id, name: products[5].name, sku: products[5].sku, price: products[5].price, quantity: 3, image: products[5].images?.[0]?.url },
          { productId: products[7]._id, name: products[7].name, sku: products[7].sku, price: products[7].price, quantity: 5, image: products[7].images?.[0]?.url },
        ],
        subtotal: products[5].price * 3 + products[7].price * 5,
        shipping: 3000, tax: Math.round((products[5].price * 3 + products[7].price * 5) * 0.18), discount: 50000,
        total: products[5].price * 3 + products[7].price * 5 + 3000 + Math.round((products[5].price * 3 + products[7].price * 5) * 0.18) - 50000,
        currency: 'RWF',
        shippingAddress: { street: 'KG 5 Ave', city: 'Kigali', country: 'RW', fullName: 'Jane Customer', phone: '+250788400000' },
        paymentMethod: 'cod', paymentStatus: 'pending',
        couponCode: 'FLASH50', couponDiscount: 50000,
        createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
      },
    ];

    const orders = [];
    for (const data of orderData) {
      const order = await Order.create({
        ...data,
        tenantId: tenant._id, userId: customer._id, vendorId: vendor._id,
      });

      await Payment.create({
        tenantId: tenant._id, userId: customer._id, orderId: order._id,
        amount: order.total, currency: order.currency,
        method: order.paymentMethod,
        status: order.paymentStatus === 'paid' ? 'paid' : 'pending',
        paidAt: order.paymentStatus === 'paid' ? order.createdAt : null,
        transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      });

      orders.push(order);
    }
    logger.info(`${orders.length} orders created with payments`);

    logger.info('=== ORDER SEEDING COMPLETE ===');
    process.exit(0);
  } catch (error) {
    logger.error(`Order seeding failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

seedOrders();
