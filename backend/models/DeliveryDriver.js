const mongoose = require('mongoose');

const deliveryDriverSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true,
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
  },
  email: String,
  avatar: String,
  vehicle: {
    type: { type: String, enum: ['motorcycle', 'car', 'van', 'truck', 'bicycle', 'foot'], default: 'motorcycle' },
    model: String,
    color: String,
    plateNumber: String,
    capacity: { weight: Number, volume: Number },
  },
  licenseNumber: String,
  licenseExpiry: Date,
  insuranceNumber: String,
  insuranceExpiry: Date,
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'suspended', 'rejected'],
    default: 'pending',
  },
  currentOrderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  successfulDeliveries: {
    type: Number,
    default: 0,
  },
  failedDeliveries: {
    type: Number,
    default: 0,
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  earnings: {
    total: { type: Number, default: 0 },
    today: { type: Number, default: 0 },
    week: { type: Number, default: 0 },
    month: { type: Number, default: 0 },
    currency: { type: String, default: 'RWF' },
  },
  documents: [{
    type: { type: String, enum: ['id', 'license', 'insurance', 'background_check'] },
    url: String,
    verified: { type: Boolean, default: false },
    verifiedAt: Date,
  }],
  settings: {
    maxOrderDistance: { type: Number, default: 50 },
    maxConcurrentOrders: { type: Number, default: 3 },
    autoAccept: { type: Boolean, default: false },
    notifications: {
      newOrder: { type: Boolean, default: true },
      payment: { type: Boolean, default: true },
    },
  },
  lastActiveAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: Date,
}, {
  timestamps: true,
});

deliveryDriverSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
deliveryDriverSchema.index({ currentLocation: '2dsphere' });
deliveryDriverSchema.index({ tenantId: 1, isOnline: 1, isAvailable: 1 });
deliveryDriverSchema.index({ tenantId: 1, status: 1 });
deliveryDriverSchema.index({ partnerId: 1 });

deliveryDriverSchema.statics.findNearby = async function(coordinates, maxDistance = 10000, limit = 10) {
  return this.find({
    currentLocation: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistance,
      },
    },
    isOnline: true,
    isAvailable: true,
    status: 'verified',
  }).limit(limit);
};

module.exports = mongoose.model('DeliveryDriver', deliveryDriverSchema);
