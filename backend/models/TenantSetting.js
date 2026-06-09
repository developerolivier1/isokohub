const mongoose = require('mongoose');

const tenantSettingSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  key: {
    type: String,
    required: [true, 'Setting key is required'],
    trim: true,
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Setting value is required'],
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'json', 'array'],
    default: 'string',
  },
  category: {
    type: String,
    enum: ['general', 'payment', 'shipping', 'tax', 'email', 'appearance', 'seo', 'security'],
    default: 'general',
  },
  description: String,
  isPublic: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

tenantSettingSchema.index({ tenantId: 1, key: 1 }, { unique: true });
tenantSettingSchema.index({ tenantId: 1, category: 1 });

tenantSettingSchema.statics.getSetting = async function(tenantId, key, defaultValue = null) {
  const setting = await this.findOne({ tenantId, key });
  return setting ? setting.value : defaultValue;
};

tenantSettingSchema.statics.setSetting = async function(tenantId, key, value, category = 'general') {
  return this.findOneAndUpdate(
    { tenantId, key },
    { tenantId, key, value, category, type: typeof value },
    { upsert: true, new: true, runValidators: true }
  );
};

tenantSettingSchema.statics.getCategorySettings = async function(tenantId, category) {
  return this.find({ tenantId, category });
};

module.exports = mongoose.model('TenantSetting', tenantSettingSchema);
