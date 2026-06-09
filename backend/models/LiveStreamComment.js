const mongoose = require('mongoose');

const liveStreamCommentSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  liveStreamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveStream',
    required: [true, 'Live Stream ID is required'],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [500, 'Message cannot exceed 500 characters'],
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isModerated: {
    type: Boolean,
    default: false,
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  repliedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LiveStreamComment',
  },
}, {
  timestamps: true,
});

liveStreamCommentSchema.index({ tenantId: 1, liveStreamId: 1, createdAt: 1 });
liveStreamCommentSchema.index({ userId: 1 });

module.exports = mongoose.model('LiveStreamComment', liveStreamCommentSchema);
