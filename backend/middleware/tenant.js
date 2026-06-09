const Tenant = require('../models/Tenant');
const { AppError, asyncHandler } = require('./error');
const logger = require('../utils/logger');

const resolveTenant = asyncHandler(async (req, res, next) => {
  let tenantId = null;

  if (req.headers['x-tenant-id']) {
    tenantId = req.headers['x-tenant-id'];
  } else if (req.headers['x-tenant-slug']) {
    const tenant = await Tenant.findOne({ slug: req.headers['x-tenant-slug'], isActive: true });
    if (!tenant) {
      return next(new AppError('Invalid tenant slug.', 404, 'TENANT_NOT_FOUND'));
    }
    tenantId = tenant._id;
    req.tenant = tenant;
  } else if (req.user && req.user.tenantId) {
    tenantId = req.user.tenantId;
  } else if (req.query.tenantId) {
    tenantId = req.query.tenantId;
  } else if (req.body && req.body.tenantSlug) {
    const tenant = await Tenant.findOne({ slug: req.body.tenantSlug, isActive: true });
    if (tenant) {
      tenantId = tenant._id;
      req.tenant = tenant;
    }
  } else {
    const host = req.get('host');
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
        const tenant = await Tenant.findOne({
          $or: [
            { slug: subdomain, isActive: true },
            { domain: host, isActive: true },
            { customDomain: host, isActive: true },
          ],
        });
        if (tenant) {
          tenantId = tenant._id;
          req.tenant = tenant;
        }
      }
    }
  }

  if (!tenantId && process.env.NODE_ENV === 'development') {
    let defaultTenant = await Tenant.findOne({ isActive: true });
    if (!defaultTenant) {
      defaultTenant = await Tenant.create({
        name: 'Default Dev Tenant',
        slug: 'dev',
        isActive: true,
        plan: 'enterprise',
        planStatus: 'active',
      });
    }
    tenantId = defaultTenant._id;
    req.tenant = defaultTenant;
  }

  if (!tenantId) {
    return next(new AppError('Tenant could not be resolved.', 400, 'TENANT_REQUIRED'));
  }

  req.tenantId = tenantId;
  if (!req.tenant) {
    req.tenant = await Tenant.findById(tenantId);
  }

  if (!req.tenant || !req.tenant.isActive) {
    return next(new AppError('Tenant not found or inactive.', 404, 'TENANT_INACTIVE'));
  }

  if (req.tenant.planStatus === 'suspended' || req.tenant.planStatus === 'cancelled') {
    return next(new AppError('Tenant account is suspended. Please contact support.', 403, 'TENANT_SUSPENDED'));
  }

  next();
});

const requireTenantFeature = (feature) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return next(new AppError('Tenant context required.', 400));
    }
    if (!req.tenant.hasFeature(feature)) {
      return next(
        new AppError(`Your plan does not support "${feature}" feature. Please upgrade your plan.`, 403, 'FEATURE_NOT_AVAILABLE')
      );
    }
    next();
  };
};

const checkTenantCapacity = (resource) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.tenant) return next();
    if (resource === 'vendor') {
      const canAdd = await req.tenant.canAddVendor();
      if (!canAdd) {
        return next(new AppError('Vendor limit reached for this tenant. Please upgrade your plan.', 403, 'LIMIT_REACHED'));
      }
    }
    if (resource === 'product') {
      const canAdd = await req.tenant.canAddProduct();
      if (!canAdd) {
        return next(new AppError('Product limit reached for this tenant. Please upgrade your plan.', 403, 'LIMIT_REACHED'));
      }
    }
    next();
  });
};

const tenantRateLimit = (maxRequests = 1000, windowMs = 60000) => {
  const requests = new Map();
  return (req, res, next) => {
    const key = req.tenantId ? req.tenantId.toString() : req.ip;
    const now = Date.now();
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    const timestamps = requests.get(key).filter(ts => now - ts < windowMs);
    if (timestamps.length >= maxRequests) {
      return next(new AppError('Tenant rate limit exceeded. Please try again later.', 429, 'TENANT_RATE_LIMIT'));
    }
    timestamps.push(now);
    requests.set(key, timestamps);
    next();
  };
};

module.exports = {
  resolveTenant,
  requireTenantFeature,
  checkTenantCapacity,
  tenantRateLimit,
};
