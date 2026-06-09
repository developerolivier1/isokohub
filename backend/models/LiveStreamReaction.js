const mongoose = require('mongoose');

const liveStreamReactionSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['like', 'heart', 'laugh', 'wow', 'sad', 'angry', 'clap'],
    required: [true, 'Reaction type is required'],
  },
}, {
  timestamps: true,
});

liveStreamReactionSchema.index({ tenantId: 1, liveStreamId: 1, userId: 1, type: 1 }, { unique: true });
liveStreamReactionSchema.index({ liveStreamId: 1, type: 1 });
liveStreamReactionSchema.index({ userId: 1 });

module.exports = mongoose.model('LiveStreamReaction', liveStreamReactionSchema);
