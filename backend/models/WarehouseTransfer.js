const mongoose = require('mongoose');

const warehouseTransferSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  transferNumber: {
    type: String,
    required: true,
    unique: true,
  },
  fromWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Source warehouse is required'],
  },
  toWarehouseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: [true, 'Destination warehouse is required'],
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantId: mongoose.Schema.Types.ObjectId,
    quantity: { type: Number, required: true, min: 1 },
    unitCost: Number,
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'in_transit', 'completed', 'cancelled'],
    default: 'draft',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  initiatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: Date,
  notes: String,
  expectedDeliveryDate: Date,
  completedAt: Date,
}, {
  timestamps: true,
});

warehouseTransferSchema.index({ tenantId: 1, status: 1 });
warehouseTransferSchema.index({ fromWarehouseId: 1, toWarehouseId: 1 });

warehouseTransferSchema.pre('validate', function(next) {
  if (!this.transferNumber) {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.transferNumber = `TRF-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('WarehouseTransfer', warehouseTransferSchema);
