const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/isokohub_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-not-for-production';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-not-for-production';

const mongoose = require('mongoose');

before(async function () {
  this.timeout(10000);
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

after(async function () {
  this.timeout(10000);
  if (mongoose.connection.readyState !== 0) {
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
    await mongoose.connection.close();
  }
});
