const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
  },
  sku: {
    type: String,
    required: [true, 'SKU is required'],
    trim: true,
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0,
    default: 0,
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  availableQuantity: {
    type: Number,
    default: 0,
  },
  lowStockThreshold: {
    type: Number,
    default: 10,
  },
  reorderPoint: {
    type: Number,
    default: 20,
  },
  reorderQuantity: {
    type: Number,
    default: 50,
  },
  unitCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  location: {
    aisle: String,
    shelf: String,
    bin: String,
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'],
    default: 'in_stock',
  },
  lastCountedAt: Date,
  lastRestockedAt: Date,
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

inventorySchema.index({ tenantId: 1, productId: 1, warehouseId: 1 }, { unique: true });
inventorySchema.index({ tenantId: 1, sku: 1 });
inventorySchema.index({ tenantId: 1, status: 1 });
inventorySchema.index({ warehouseId: 1, status: 1 });
inventorySchema.index({ quantity: 1, lowStockThreshold: 1 });

inventorySchema.pre('save', function(next) {
  this.availableQuantity = Math.max(0, this.quantity - this.reservedQuantity);
  if (this.quantity <= 0) {
    this.status = 'out_of_stock';
  } else if (this.quantity <= this.lowStockThreshold) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
  next();
});

inventorySchema.methods.reserve = function(quantity) {
  if (this.availableQuantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.availableQuantity}, Requested: ${quantity}`);
  }
  this.reservedQuantity += quantity;
  return this.save();
};

inventorySchema.methods.release = function(quantity) {
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  return this.save();
};

inventorySchema.methods.decrement = function(quantity) {
  if (this.quantity < quantity) {
    throw new Error(`Insufficient stock. Available: ${this.quantity}, Requested: ${quantity}`);
  }
  this.quantity -= quantity;
  this.reservedQuantity = Math.max(0, this.reservedQuantity - quantity);
  return this.save();
};

inventorySchema.methods.increment = function(quantity, cost) {
  this.quantity += quantity;
  if (cost) this.unitCost = cost;
  this.lastRestockedAt = new Date();
  return this.save();
};

inventorySchema.statics.isLowStock = async function(tenantId) {
  return this.find({
    tenantId,
    $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
  }).populate('productId', 'name sku');
};

module.exports = mongoose.model('Inventory', inventorySchema);
