const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  plan: {
    type: String,
    enum: ['basic', 'professional', 'enterprise'],
    required: [true, 'Plan is required'],
  },
  status: {
    type: String,
    enum: ['active', 'trialing', 'past_due', 'canceled', 'expired'],
    default: 'trialing',
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly',
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
  },
  currency: {
    type: String,
    default: 'USD',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  trialEndsAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  },
  currentPeriodStart: {
    type: Date,
    default: Date.now,
  },
  currentPeriodEnd: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  },
  canceledAt: Date,
  cancellationReason: String,
  stripeSubscriptionId: String,
  stripePriceId: String,
  paypalSubscriptionId: String,
  paymentMethod: {
    type: String,
    enum: ['stripe', 'paypal', 'mobile_money', 'bank_transfer'],
  },
  invoices: [{
    invoiceNumber: String,
    amount: Number,
    currency: String,
    status: { type: String, enum: ['paid', 'pending', 'failed'] },
    paidAt: Date,
    dueDate: Date,
    url: String,
  }],
  meta: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

subscriptionSchema.index({ tenantId: 1 }, { unique: true });
subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ plan: 1, status: 1 });

subscriptionSchema.methods.isActive = function() {
  return ['active', 'trialing'].includes(this.status) && new Date() < this.currentPeriodEnd;
};

subscriptionSchema.methods.canRenew = function() {
  return ['canceled', 'expired'].includes(this.status);
};

subscriptionSchema.methods.renew = function(period = 'monthly') {
  this.status = 'active';
  this.billingCycle = period;
  this.currentPeriodStart = new Date();
  this.currentPeriodEnd = new Date(Date.now() + (period === 'yearly' ? 365 : 30) * 24 * 60 * 60 * 1000);
  this.canceledAt = undefined;
  this.cancellationReason = undefined;
  return this.save();
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
