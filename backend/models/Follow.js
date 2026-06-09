const mongoose = require('mongoose');

const followSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  followerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Follower ID is required'],
  },
  followingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Following ID is required'],
  },
  followingType: {
    type: String,
    enum: ['user', 'vendor'],
    default: 'user',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

followSchema.index({ tenantId: 1, followerId: 1 });
followSchema.index({ tenantId: 1, followingId: 1 });
followSchema.index({ tenantId: 1, followerId: 1, followingId: 1 }, { unique: true });

followSchema.statics.getFollowers = async function(userId, tenantId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [followers, total] = await Promise.all([
    this.find({ followingId: userId, tenantId, isActive: true })
      .populate('followerId', 'name avatar')
      .skip(skip).limit(limit).sort({ createdAt: -1 }),
    this.countDocuments({ followingId: userId, tenantId, isActive: true }),
  ]);
  return { followers, total, page, limit, pages: Math.ceil(total / limit) };
};

followSchema.statics.getFollowing = async function(userId, tenantId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const [following, total] = await Promise.all([
    this.find({ followerId: userId, tenantId, isActive: true })
      .populate('followingId', 'name avatar')
      .skip(skip).limit(limit).sort({ createdAt: -1 }),
    this.countDocuments({ followerId: userId, tenantId, isActive: true }),
  ]);
  return { following, total, page, limit, pages: Math.ceil(total / limit) };
};

module.exports = mongoose.model('Follow', followSchema);
