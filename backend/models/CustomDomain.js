const mongoose = require('mongoose');

const customDomainSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
  },
  domain: {
    type: String,
    required: [true, 'Domain name is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/, 'Invalid domain format'],
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending',
  },
  verificationToken: {
    type: String,
    required: true,
  },
  verificationMethod: {
    type: String,
    enum: ['cname', 'txt', 'http'],
    default: 'cname',
  },
  sslStatus: {
    type: String,
    enum: ['pending', 'active', 'failed'],
    default: 'pending',
  },
  sslCertificate: {
    type: String,
    default: null,
  },
  isPrimary: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  dnsRecords: [{
    type: { type: String, enum: ['A', 'AAAA', 'CNAME', 'TXT'] },
    name: String,
    value: String,
    ttl: { type: Number, default: 3600 },
  }],
  verifiedAt: Date,
  lastCheckedAt: Date,
  failureReason: String,
}, {
  timestamps: true,
});

customDomainSchema.index({ tenantId: 1 });
customDomainSchema.index({ tenantId: 1, isPrimary: 1 });

customDomainSchema.pre('save', function(next) {
  if (this.isNew) {
    this.verificationToken = require('crypto').randomBytes(32).toString('hex');
    this.dnsRecords = [
      {
        type: 'CNAME',
        name: this.domain,
        value: `verify.isokohub.com`,
        ttl: 3600,
      },
      {
        type: 'TXT',
        name: this.domain,
        value: `isokohub-verify=${this.verificationToken}`,
        ttl: 3600,
      },
    ];
  }
  next();
});

customDomainSchema.methods.verify = async function() {
  const dns = require('dns').promises;
  try {
    const txtRecords = await dns.resolveTxt(this.domain);
    const isVerified = txtRecords.some(record =>
      record.some(value => value.includes(this.verificationToken))
    );
    if (isVerified) {
      this.verificationStatus = 'verified';
      this.isActive = true;
      this.verifiedAt = new Date();
    } else {
      this.verificationStatus = 'failed';
      this.failureReason = 'DNS TXT record not found or token mismatch';
    }
    this.lastCheckedAt = new Date();
    return isVerified;
  } catch (error) {
    this.verificationStatus = 'failed';
    this.failureReason = error.message;
    this.lastCheckedAt = new Date();
    return false;
  }
};

module.exports = mongoose.model('CustomDomain', customDomainSchema);
