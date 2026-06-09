const mongoose = require('mongoose');

const customerSegmentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Segment name is required'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  description: String,
  rules: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Segment rules are required'],
  },
  conditions: [{
    field: { type: String, required: true },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'between', 'in', 'not_in', 'exists'],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  }],
  logic: {
    type: String,
    enum: ['and', 'or'],
    default: 'and',
  },
  memberCount: {
    type: Number,
    default: 0,
  },
  isDynamic: {
    type: Boolean,
    default: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastCalculatedAt: Date,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

customerSegmentSchema.index({ tenantId: 1, isActive: 1 });
customerSegmentSchema.index({ tenantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('CustomerSegment', customerSegmentSchema);
