const mongoose = require('mongoose');

const inventoryLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  inventoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: [true, 'Inventory ID is required'],
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  warehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
  },
  type: {
    type: String,
    enum: [
      'restock', 'sale', 'reserve', 'release', 'transfer_out',
      'transfer_in', 'adjustment', 'return', 'damage', 'loss',
    ],
    required: [true, 'Log type is required'],
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
  },
  quantityBefore: {
    type: Number,
    required: true,
  },
  quantityAfter: {
    type: Number,
    required: true,
  },
  reference: String,
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  notes: String,
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Performed by is required'],
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

inventoryLogSchema.index({ tenantId: 1, inventoryId: 1, createdAt: -1 });
inventoryLogSchema.index({ tenantId: 1, productId: 1 });
inventoryLogSchema.index({ tenantId: 1, warehouseId: 1 });
inventoryLogSchema.index({ tenantId: 1, type: 1 });
inventoryLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('InventoryLog', inventoryLogSchema);
