const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    mongoose.set('strictQuery', true);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected successfully');
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

const getTenantDB = (tenantId) => {
  const tenantDbName = `${process.env.TENANT_DB_PREFIX}${tenantId}`;
  const tenantConnection = mongoose.createConnection(
    `${process.env.MONGODB_URI}-${tenantDbName}`,
    {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
    }
  );
  return tenantConnection;
};

const closeConnections = async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connections closed');
  } catch (error) {
    logger.error(`Error closing MongoDB connections: ${error.message}`);
  }
};

module.exports = { connectDB, getTenantDB, closeConnections };
