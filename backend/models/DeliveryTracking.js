const mongoose = require('mongoose');

const deliveryTrackingSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: [true, 'Order ID is required'],
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryDriver',
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryPartner',
  },
  status: {
    type: String,
    enum: [
      'pending_assignment', 'assigned', 'picked_up', 'in_transit',
      'nearby', 'delivered', 'failed', 'returned',
    ],
    default: 'pending_assignment',
  },
  location: {
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
  locationHistory: [{
    coordinates: { latitude: Number, longitude: Number },
    timestamp: { type: Date, default: Date.now },
    speed: Number,
    accuracy: Number,
    bearing: Number,
  }],
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  pickupTime: Date,
  deliveryAttempts: {
    type: Number,
    default: 0,
  },
  otpCode: String,
  otpVerified: {
    type: Boolean,
    default: false,
  },
  otpVerifiedAt: Date,
  proofOfDelivery: {
    signature: String,
    photo: String,
    note: String,
    receiverName: String,
  },
  currentStop: {
    type: Number,
    default: 0,
  },
  totalStops: {
    type: Number,
    default: 0,
  },
  distanceRemaining: {
    type: Number,
    default: 0,
  },
  durationRemaining: {
    type: Number,
    default: 0,
  },
  estimatedDistance: {
    type: Number,
    default: 0,
  },
  estimatedDuration: {
    type: Number,
    default: 0,
  },
  trackingUrl: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

deliveryTrackingSchema.index({ tenantId: 1, orderId: 1 }, { unique: true });
deliveryTrackingSchema.index({ tenantId: 1, driverId: 1 });
deliveryTrackingSchema.index({ location: '2dsphere' });
deliveryTrackingSchema.index({ status: 1 });
deliveryTrackingSchema.index({ tenantId: 1, status: 1, createdAt: -1 });

deliveryTrackingSchema.pre('save', function(next) {
  if (this.isModified('location.coordinates') && this.location.coordinates) {
    this.locationHistory.push({
      coordinates: {
        latitude: this.location.coordinates[1],
        longitude: this.location.coordinates[0],
      },
      timestamp: new Date(),
    });
  }
  next();
});

deliveryTrackingSchema.methods.updateLocation = function(longitude, latitude) {
  this.location.coordinates = [longitude, latitude];
  this.locationHistory.push({
    coordinates: { latitude, longitude },
    timestamp: new Date(),
  });
  return this.save();
};

module.exports = mongoose.model('DeliveryTracking', deliveryTrackingSchema);
