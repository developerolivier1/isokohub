const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  conversationId: {
    type: String,
    required: [true, 'Conversation ID is required'],
    index: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required'],
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Receiver ID is required'],
  },
  message: {
    type: String,
    maxlength: [5000, 'Message cannot exceed 5000 characters'],
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'order', 'product', 'system'],
    default: 'text',
  },
  media: [{
    url: String,
    type: { type: String, enum: ['image', 'file'] },
    name: String,
    size: Number,
  }],
  metadata: {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

chatMessageSchema.index({ conversationId: 1, createdAt: 1 });
chatMessageSchema.index({ senderId: 1, receiverId: 1 });
chatMessageSchema.index({ tenantId: 1, conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ isRead: 1, receiverId: 1 });

chatMessageSchema.statics.getConversation = async function(senderId, receiverId, tenantId) {
  const convId = [senderId.toString(), receiverId.toString()].sort().join(':');
  return this.find({ conversationId: `conv:${convId}`, tenantId })
    .sort({ createdAt: 1 })
    .limit(100);
};

chatMessageSchema.statics.getUnreadCount = async function(userId, tenantId) {
  return this.countDocuments({ receiverId: userId, tenantId, isRead: false });
};

chatMessageSchema.statics.markConversationRead = async function(senderId, receiverId, tenantId) {
  const convId = `conv:${[senderId.toString(), receiverId.toString()].sort().join(':')}`;
  return this.updateMany(
    { conversationId: convId, receiverId: senderId, tenantId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
