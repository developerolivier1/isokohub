const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: [
      'order_confirmed', 'order_shipped', 'order_delivered', 'order_cancelled',
      'payment_received', 'payment_failed', 'refund_processed',
      'vendor_approved', 'vendor_rejected',
      'new_message', 'new_review', 'new_follower',
      'live_stream_started', 'deal_available', 'price_drop',
      'stock_alert', 'wishlist_alert',
      'wallet_credit', 'wallet_debit', 'withdrawal_status',
      'system', 'promotion', 'security',
    ],
    required: [true, 'Notification type is required'],
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  data: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
  image: String,
  link: String,
  isRead: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    push: { type: Boolean, default: false },
  },
  sentVia: [String],
}, {
  timestamps: true,
});

notificationSchema.index({ tenantId: 1, userId: 1, createdAt: -1 });
notificationSchema.index({ tenantId: 1, userId: 1, isRead: 1 });
notificationSchema.index({ tenantId: 1, type: 1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

notificationSchema.statics.markAsRead = async function(notificationId, userId) {
  return this.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

notificationSchema.statics.markAllAsRead = async function(userId, tenantId) {
  return this.updateMany(
    { userId, tenantId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

notificationSchema.statics.getUnreadCount = async function(userId, tenantId) {
  return this.countDocuments({ userId, tenantId, isRead: false });
};

module.exports = mongoose.model('Notification', notificationSchema);
