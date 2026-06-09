const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Target ID is required'],
  },
  targetType: {
    type: String,
    enum: ['product', 'review', 'comment', 'post', 'live_stream'],
    required: [true, 'Target type is required'],
  },
}, {
  timestamps: true,
});

likeSchema.index({ tenantId: 1, targetId: 1, targetType: 1 });
likeSchema.index({ tenantId: 1, userId: 1, targetId: 1, targetType: 1 }, { unique: true });
likeSchema.index({ userId: 1 });

likeSchema.statics.toggle = async function(userId, tenantId, targetId, targetType) {
  const existing = await this.findOne({ userId, tenantId, targetId, targetType });
  if (existing) {
    await existing.deleteOne();
    return { liked: false };
  }
  await this.create({ userId, tenantId, targetId, targetType });
  return { liked: true };
};

likeSchema.statics.getCount = async function(targetId, targetType) {
  return this.countDocuments({ targetId, targetType });
};

module.exports = mongoose.model('Like', likeSchema);
