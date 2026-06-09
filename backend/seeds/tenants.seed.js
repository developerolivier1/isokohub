const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const { connectDB } = require('../config/db');
const logger = require('../utils/logger');
const Tenant = require('../models/Tenant');

const seedTenants = async () => {
  try {
    await connectDB();
    logger.info('Connected to MongoDB for tenant seeding...');

    await Tenant.deleteMany({});
    logger.info('Cleared existing tenants');

    const tenant = await Tenant.create({
      name: 'ISOKOHUB Rwanda',
      slug: 'isokohub',
      primaryColor: '#667eea',
      secondaryColor: '#764ba2',
      plan: 'enterprise',
      planStatus: 'active',
      features: {
        liveStreaming: true,
        multiWarehouse: true,
        aiRecommendations: true,
        affiliateProgram: true,
        customDomain: true,
        apiAccess: true,
        analytics: true,
        prioritySupport: true,
      },
      isActive: true,
      setupComplete: true,
    });

    logger.info(`Tenant created: ${tenant.name} (${tenant._id})`);
    logger.info('=== TENANT SEEDING COMPLETE ===');

    process.exit(0);
  } catch (error) {
    logger.error(`Tenant seeding failed: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

seedTenants();
