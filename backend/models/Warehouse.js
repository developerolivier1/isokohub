const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Warehouse name is required'],
    trim: true,
  },
  code: {
    type: String,
    required: [true, 'Warehouse code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['primary', 'secondary', 'fulfillment', 'returns'],
    default: 'secondary',
  },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: String,
    zipCode: String,
    country: { type: String, default: 'RW' },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  contactPerson: {
    name: String,
    phone: String,
    email: String,
  },
  capacity: {
    maxItems: Number,
    currentItems: { type: Number, default: 0 },
    utilizationPercent: { type: Number, default: 0 },
  },
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String, closed: { type: Boolean, default: true } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: true } },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

warehouseSchema.index({ tenantId: 1 });
warehouseSchema.index({ location: '2dsphere' });
warehouseSchema.index({ tenantId: 1, isActive: 1 });

warehouseSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await mongoose.model('Warehouse').updateMany(
      { tenantId: this.tenantId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  if (this.capacity.maxItems) {
    this.capacity.utilizationPercent = (this.capacity.currentItems / this.capacity.maxItems) * 100;
  }
  next();
});

warehouseSchema.statics.findNearest = async function(coordinates, maxDistance = 50000) {
  return this.find({
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates },
        $maxDistance: maxDistance,
      },
    },
    isActive: true,
  });
};

module.exports = mongoose.model('Warehouse', warehouseSchema);
