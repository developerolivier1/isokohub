const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const nodeCrypto = require('crypto');

const userSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[1-9]\d{6,14}$/, 'Please provide a valid phone number'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false,
  },
  role: {
    type: String,
    enum: ['superadmin', 'tenant_admin', 'vendor', 'customer', 'delivery_driver', 'support'],
    default: 'customer',
  },
  avatar: {
    type: String,
    default: null,
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'RW' },
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      default: [0, 0],
    },
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  phoneVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  twoFactorSecret: String,
  lastLogin: Date,
  passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  preferences: {
    language: { type: String, enum: ['en', 'rw', 'fr', 'sw'], default: 'en' },
    currency: { type: String, enum: ['RWF', 'USD', 'EUR', 'GBP'], default: 'RWF' },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
    },
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  },
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ location: '2dsphere' });
userSchema.index({ isActive: 1, emailVerified: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  this.passwordChangedAt = new Date();
  next();
});

userSchema.pre('save', function(next) {
  if (this.isModified('email') && !this.isNew) {
    this.emailVerified = false;
    this.emailVerificationToken = nodeCrypto.randomBytes(32).toString('hex');
    this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  }
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = nodeCrypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = nodeCrypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
  return resetToken;
};

userSchema.methods.generateEmailVerificationToken = function() {
  const verifyToken = nodeCrypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = nodeCrypto.createHash('sha256').update(verifyToken).digest('hex');
  this.emailVerificationExpire = Date.now() + 24 * 60 * 60 * 1000;
  return verifyToken;
};

userSchema.methods.toPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    avatar: this.avatar,
    role: this.role,
    address: this.address,
    emailVerified: this.emailVerified,
    phoneVerified: this.phoneVerified,
    preferences: this.preferences,
    createdAt: this.createdAt,
  };
};

module.exports = mongoose.model('User', userSchema);
