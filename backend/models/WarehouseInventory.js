const mongoose = require('mongoose');

const warehouseInventorySchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Warehouse ID is required'],
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0,
  },
  reservedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  minStockLevel: {
    type: Number,
    default: 5,
  },
  maxStockLevel: {
    type: Number,
    default: 100,
  },
  reorderPoint: {
    type: Number,
    default: 10,
  },
  location: {
    zone: String,
    aisle: String,
    rack: String,
    shelf: String,
    bin: String,
  },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock', 'overstocked'],
    default: 'in_stock',
  },
  lastCountedAt: Date,
  lastRestockedAt: Date,
}, {
  timestamps: true,
});

warehouseInventorySchema.index({ tenantId: 1, warehouseId: 1, productId: 1 }, { unique: true });
warehouseInventorySchema.index({ tenantId: 1, warehouseId: 1, status: 1 });
warehouseInventorySchema.index({ tenantId: 1, productId: 1 });

warehouseInventorySchema.pre('save', function(next) {
  const available = this.quantity - this.reservedQuantity;
  if (available <= 0) this.status = 'out_of_stock';
  else if (available <= this.minStockLevel) this.status = 'low_stock';
  else if (available >= this.maxStockLevel) this.status = 'overstocked';
  else this.status = 'in_stock';
  next();
});

module.exports = mongoose.model('WarehouseInventory', warehouseInventorySchema);
