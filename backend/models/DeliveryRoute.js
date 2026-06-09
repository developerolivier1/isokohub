const mongoose = require('mongoose');

const deliveryRouteSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DeliveryDriver',
    required: [true, 'Driver ID is required'],
  },
  date: {
    type: Date,
    required: true,
  },
  stops: [{
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    stopNumber: { type: Number, required: true },
    address: {
      street: String,
      city: String,
      coordinates: { latitude: Number, longitude: Number },
    },
    estimatedArrival: Date,
    actualArrival: Date,
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'skipped', 'failed'],
      default: 'pending',
    },
    distanceFromPrevious: Number,
    durationFromPrevious: Number,
    notes: String,
    signature: String,
    photo: String,
  }],
  totalDistance: {
    type: Number,
    default: 0,
  },
  totalDuration: {
    type: Number,
    default: 0,
  },
  optimizedOrder: [{
    type: mongoose.Schema.Types.Mixed,
  }],
  status: {
    type: String,
    enum: ['planned', 'in_progress', 'completed', 'cancelled'],
    default: 'planned',
  },
  startedAt: Date,
  completedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

deliveryRouteSchema.index({ tenantId: 1, driverId: 1, date: 1 });
deliveryRouteSchema.index({ tenantId: 1, status: 1 });
deliveryRouteSchema.index({ 'stops.orderId': 1 });

module.exports = mongoose.model('DeliveryRoute', deliveryRouteSchema);
