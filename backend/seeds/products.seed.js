const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { connectDB } = require('../config/db');
const logger = require('../utils/logger');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');
const Warehouse = require('../models/Warehouse');

const seedProducts = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB for product seeding...');

    const tenant = await Tenant.findOne({ slug: 'isokohub' });
    if (!tenant) {
      logger.error('No tenant found. Run seed:tenants first.');
      process.exit(1);
    }

    const vendor = await Vendor.findOne({ tenantId: tenant._id });
    if (!vendor) {
      logger.error('No vendor found. Run seed:users first.');
      process.exit(1);
    }

    const adminUser = await User.findOne({ role: 'superadmin', tenantId: tenant._id });

    await Category.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await Coupon.deleteMany({});
    await Warehouse.deleteMany({});
    logger.info('Cleared existing categories, products, inventory, coupons, warehouses');

    const electronics = await Category.create({
      tenantId: tenant._id, name: 'Electronics', slug: 'electronics',
      description: 'Electronic devices and accessories', icon: 'smartphone',
      isActive: true, isFeatured: true, sortOrder: 1,
      attributes: [
        { name: 'Brand', type: 'text', filterable: true },
        { name: 'Color', type: 'color', filterable: true },
        { name: 'Storage', type: 'select', options: ['32GB', '64GB', '128GB', '256GB', '512GB'], filterable: true },
      ],
    });

    const phones = await Category.create({
      tenantId: tenant._id, name: 'Smartphones', slug: 'smartphones',
      parent: electronics._id, isActive: true, sortOrder: 1,
    });

    const laptops = await Category.create({
      tenantId: tenant._id, name: 'Laptops', slug: 'laptops',
      parent: electronics._id, isActive: true, sortOrder: 2,
    });

    const clothing = await Category.create({
      tenantId: tenant._id, name: 'Clothing & Fashion', slug: 'clothing-fashion',
      description: 'Traditional and modern fashion', icon: 'shirt',
      isActive: true, sortOrder: 2,
    });

    const homeGoods = await Category.create({
      tenantId: tenant._id, name: 'Home & Living', slug: 'home-living',
      description: 'Home decor and essentials', icon: 'home',
      isActive: true, sortOrder: 3,
    });
    logger.info('Categories created');

    const categories = { electronics, phones, laptops, clothing, homeGoods };

    const productData = [
      {
        name: 'iPhone 15 Pro Max',
        description: 'The most powerful iPhone ever. A17 Pro chip, 48MP camera system, titanium design.',
        price: 1800000, comparePrice: 2000000, category: phones._id,
        images: [{ url: 'https://via.placeholder.com/600x600?text=iPhone+15+Pro+Max', isPrimary: true }],
        brand: 'Apple', tags: ['iphone', 'apple', 'smartphone', 'premium'],
        featured: true, status: 'active',
        variants: [
          { name: '256GB', sku: 'IP15PM-256', price: 1800000, stock: 15, attributes: [{ name: 'Storage', value: '256GB' }] },
          { name: '512GB', sku: 'IP15PM-512', price: 2100000, stock: 10, attributes: [{ name: 'Storage', value: '512GB' }] },
        ],
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Galaxy AI is here. Titanium design, 200MP camera, built-in S Pen.',
        price: 1650000, comparePrice: 1850000, category: phones._id,
        images: [{ url: 'https://via.placeholder.com/600x600?text=Samsung+S24+Ultra', isPrimary: true }],
        brand: 'Samsung', tags: ['samsung', 'galaxy', 'smartphone', 'android'],
        featured: true, status: 'active',
        variants: [
          { name: '256GB', sku: 'S24U-256', price: 1650000, stock: 20, attributes: [{ name: 'Storage', value: '256GB' }] },
          { name: '512GB', sku: 'S24U-512', price: 1950000, stock: 12, attributes: [{ name: 'Storage', value: '512GB' }] },
        ],
      },
      {
        name: 'MacBook Pro 16" M3 Max',
        description: 'Supercharged by M3 Max chip. Stunning 16-inch Liquid Retina XDR display.',
        price: 4500000, comparePrice: 5000000, category: laptops._id,
        images: [{ url: 'https://via.placeholder.com/600x600?text=MacBook+Pro+16', isPrimary: true }],
        brand: 'Apple', tags: ['macbook', 'apple', 'laptop', 'pro'],
        featured: true, status: 'active',
        variants: [
          { name: '36GB/1TB', sku: 'MBP16-36-1', price: 4500000, stock: 8 },
          { name: '48GB/1TB', sku: 'MBP16-48-1', price: 5200000, stock: 5 },
        ],
      },
      {
        name: 'Traditional Kitenge Dress',
        description: 'Beautiful African print kitenge dress, made from 100% cotton with authentic Rwandan designs.',
        price: 35000, comparePrice: 45000, category: clothing._id,
        images: [{ url: 'https://via.placeholder.com/600x600?text=Kitenge+Dress', isPrimary: true }],
        brand: 'Rwanda Couture', tags: ['kitenge', 'traditional', 'african', 'fashion'],
        featured: true, status: 'active',
        variants: [
          { name: 'Small', sku: 'KTD-S', price: 35000, stock: 25, attributes: [{ name: 'Size', value: 'S' }] },
          { name: 'Medium', sku: 'KTD-M', price: 35000, stock: 30, attributes: [{ name: 'Size', value: 'M' }] },
          { name: 'Large', sku: 'KTD-L', price: 35000, stock: 20, attributes: [{ name: 'Size', value: 'L' }] },
        ],
      },
      {
        name: 'Wireless Bluetooth Earbuds',
        description: 'Premium wireless earbuds with ANC, 30hr battery, IPX5 water resistance.',
        price: 85000, comparePrice: 120000, category: phones._id,
        images: [{ url: 'https://via.placeholder.com/600x600?text=Wireless+Earbuds', isPrimary: true }],
        brand: 'SoundPro', tags: ['earbuds', 'wireless', 'bluetooth', 'audio'],
        status: 'active',
        variants: [
          { name: 'White', sku: 'WBE-WH', price: 85000, stock: 50, attributes: [{ name: 'Color', value: 'White' }] },
          { name: 'Black', sku: 'WBE-BK', price: 85000, stock: 45, attributes: [{ name: 'Color', value: 'Black' }] },
        ],
      },
      {
        name: 'Handwoven Agaseke Basket',
        description: 'Traditional Rwandan peace basket, handwoven by local artisans.',
        price: 25000, comparePrice: 30000, category: homeGoods._id,
        images: [{ url: 'https://via.placeholder.com/600x600?text=Agaseke+Basket', isPrimary: true }],
        brand: 'Rwandan Artisans', tags: ['agaseke', 'traditional', 'handmade', 'decor'],
        status: 'active',
      },
      {
        name: 'Smart Watch Pro',
        description: 'Advanced smartwatch with health monitoring, GPS, 100+ workout modes, 14-day battery.',
        price: 120000, comparePrice: 150000, category: phones._id,
        images: [{ url: 'https://via.placeholder.com/600x600?text=Smart+Watch+Pro', isPrimary: true }],
        brand: 'TechWear', tags: ['smartwatch', 'wearable', 'fitness', 'gps'],
        status: 'active',
        variants: [
          { name: 'Black', sku: 'SWP-BK', price: 120000, stock: 30 },
          { name: 'Silver', sku: 'SWP-SI', price: 120000, stock: 25 },
        ],
      },
      {
        name: 'Organic Rwandan Coffee Beans',
        description: 'Premium single-origin Arabica coffee from the highlands of Rwanda. 1kg bag.',
        price: 15000, comparePrice: 18000, category: homeGoods._id,
        images: [{ url: 'https://via.placeholder.com/600x600?text=Coffee+Beans', isPrimary: true }],
        brand: 'Rwanda Mountain Coffee', tags: ['coffee', 'organic', 'rwanda', 'arabica'],
        status: 'active',
      },
    ];

    const products = [];
    for (const data of productData) {
      const product = await Product.create({
        ...data,
        tenantId: tenant._id,
        vendorId: vendor._id,
        sku: data.variants?.[0]?.sku || `SKU-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      });

      if (product.variants && product.variants.length > 0) {
        for (const v of product.variants) {
          await Inventory.create({
            tenantId: tenant._id, productId: product._id, variantId: v._id,
            sku: v.sku, quantity: v.stock || 10,
          });
        }
      } else {
        await Inventory.create({
          tenantId: tenant._id, productId: product._id,
          sku: product.sku, quantity: 20,
        });
      }
      products.push(product);
    }
    vendor.productCount = products.length;
    await vendor.save();
    logger.info(`${products.length} products created`);

    await Coupon.create({
      tenantId: tenant._id, code: 'WELCOME10', type: 'percentage', value: 10,
      minOrderAmount: 50000, maxDiscount: 50000, usageLimit: 100, isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      description: '10% off your first order (max 50,000 RWF discount)',
      createdBy: adminUser._id,
    });

    await Coupon.create({
      tenantId: tenant._id, code: 'FREESHIPPING', type: 'free_shipping', value: 0,
      minOrderAmount: 100000, usageLimit: 50, isActive: true,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      description: 'Free shipping on orders above 100,000 RWF',
      createdBy: adminUser._id,
    });

    await Coupon.create({
      tenantId: tenant._id, code: 'FLASH50', type: 'fixed', value: 50000,
      minOrderAmount: 200000, usageLimit: 20, isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      description: '50,000 RWF off on orders above 200,000 RWF',
      createdBy: adminUser._id,
    });
    logger.info('Coupons created');

    await Warehouse.create({
      tenantId: tenant._id, name: 'Main Warehouse Kigali', code: 'KGL-MAIN',
      type: 'primary',
      address: { street: 'KK 15 Rd', city: 'Kigali', country: 'RW' },
      location: { type: 'Point', coordinates: [30.0619, -1.9441] },
      contactPerson: { name: 'Patrick Manager', phone: '+250788500000', email: 'patrick@isokohub.com' },
      capacity: { maxItems: 50000, currentItems: 0 },
      isActive: true, isDefault: true,
    });

    await Warehouse.create({
      tenantId: tenant._id, name: 'East Province Hub', code: 'EAST-HUB',
      address: { street: 'Main Street', city: 'Rwamagana', country: 'RW' },
      location: { type: 'Point', coordinates: [30.4350, -1.9480] },
      isActive: true,
    });

    await Warehouse.create({
      tenantId: tenant._id, name: 'Western Fulfillment Center', code: 'WEST-FC',
      address: { street: 'Lake Road', city: 'Rubavu', country: 'RW' },
      location: { type: 'Point', coordinates: [29.3396, -1.6910] },
      isActive: true,
    });
    logger.info('Warehouses created');

    logger.info('=== PRODUCT SEEDING COMPLETE ===');
    process.exit(0);
  } catch (error) {
    logger.error(`Product seeding failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

seedProducts();
