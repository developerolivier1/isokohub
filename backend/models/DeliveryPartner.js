const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Partner name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['internal', 'third_party', 'crowdsource'],
    default: 'internal',
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String,
  },
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
  },
  serviceAreas: [{
    city: String,
    districts: [String],
    coverageRadius: Number,
    isActive: { type: Boolean, default: true },
  }],
  pricing: {
    baseFee: { type: Number, default: 0 },
    perKmFee: { type: Number, default: 0 },
    perKgFee: { type: Number, default: 0 },
    currency: { type: String, default: 'RWF' },
    freeDeliveryThreshold: Number,
  },
  operatingHours: {
    weekday: { open: String, close: String },
    weekend: { open: String, close: String },
  },
  fleetSize: {
    type: Number,
    default: 0,
  },
  activeDrivers: {
    type: Number,
    default: 0,
  },
  totalDeliveries: {
    type: Number,
    default: 0,
  },
  successRate: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },
  averageDeliveryTime: {
    type: Number,
    default: 0,
  },
  rating: {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count: { type: Number, default: 0 },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  commissionRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  contract: {
    startDate: Date,
    endDate: Date,
    terms: String,
    documents: [String],
  },
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

deliveryPartnerSchema.index({ tenantId: 1, isActive: 1 });
deliveryPartnerSchema.index({ 'serviceAreas.city': 1 });
deliveryPartnerSchema.index({ rating: -1 });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
