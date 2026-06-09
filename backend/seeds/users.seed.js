const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { connectDB } = require('../config/db');
const logger = require('../utils/logger');
const Tenant = require('../models/Tenant');
const User = require('../models/User');
const Vendor = require('../models/Vendor');
const Wallet = require('../models/Wallet');

const seedUsers = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB for user seeding...');

    const tenant = await Tenant.findOne({ slug: 'isokohub' });
    if (!tenant) {
      logger.error('No tenant found. Run seed:tenants first.');
      process.exit(1);
    }

    await User.deleteMany({});
    await Vendor.deleteMany({});
    await Wallet.deleteMany({});
    logger.info('Cleared existing users, vendors, wallets');

    const adminUser = await User.create({
      tenantId: tenant._id,
      name: 'Super Admin',
      email: 'admin@isokohub.com',
      password: 'Admin@12345',
      phone: '+250788100000',
      role: 'superadmin',
      emailVerified: true,
    });

    const tenantAdmin = await User.create({
      tenantId: tenant._id,
      name: 'Tenant Admin',
      email: 'tenant@isokohub.com',
      password: 'Tenant@12345',
      phone: '+250788200000',
      role: 'tenant_admin',
      emailVerified: true,
    });

    const vendorUser = await User.create({
      tenantId: tenant._id,
      name: 'John Doe',
      email: 'vendor@isokohub.com',
      password: 'Vendor@12345',
      phone: '+250788300000',
      role: 'vendor',
      emailVerified: true,
    });

    const customerUser = await User.create({
      tenantId: tenant._id,
      name: 'Jane Customer',
      email: 'customer@isokohub.com',
      password: 'Customer@12345',
      phone: '+250788400000',
      role: 'customer',
      emailVerified: true,
    });

    const users = [adminUser, tenantAdmin, vendorUser, customerUser];
    for (const user of users) {
      await Wallet.create({
        userId: user._id,
        tenantId: tenant._id,
        balance: user.role === 'customer' ? 500000 : 1000000,
      });
    }
    logger.info('Wallets created');

    await Vendor.create({
      tenantId: tenant._id,
      userId: vendorUser._id,
      storeName: 'TechMart Rwanda',
      storeSlug: 'techmart-rwanda',
      description: 'Leading electronics and tech accessories store in Rwanda.',
      contactEmail: 'vendor@isokohub.com',
      contactPhone: '+250788300000',
      address: { street: 'KG 123 Ave', city: 'Kigali', country: 'RW' },
      status: 'verified',
      isFeatured: true,
      ratings: { average: 4.5, count: 128 },
      productCount: 0,
    });
    logger.info('Vendor created: TechMart Rwanda');

    logger.info('=== USER SEEDING COMPLETE ===');
    logger.info('Login Credentials:');
    logger.info('  Super Admin: admin@isokohub.com / Admin@12345');
    logger.info('  Tenant Admin: tenant@isokohub.com / Tenant@12345');
    logger.info('  Vendor: vendor@isokohub.com / Vendor@12345');
    logger.info('  Customer: customer@isokohub.com / Customer@12345');

    process.exit(0);
  } catch (error) {
    logger.error(`User seeding failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

seedUsers();
