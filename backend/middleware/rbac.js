const { AppError } = require('./error');

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized. Please log in.', 401, 'NOT_AUTHENTICATED'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`Role '${req.user.role}' is not authorized to access this resource. Required: ${roles.join(', ')}`, 403, 'FORBIDDEN')
      );
    }
    next();
  };
};

const authorizeVendor = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }
  if (!['vendor', 'tenant_admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Only vendors can perform this action.', 403));
  }
  next();
};

const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }
  if (!['tenant_admin', 'superadmin'].includes(req.user.role)) {
    return next(new AppError('Only administrators can perform this action.', 403));
  }
  next();
};

const authorizeSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Not authorized. Please log in.', 401));
  }
  if (req.user.role !== 'superadmin') {
    return next(new AppError('Only super administrators can perform this action.', 403));
  }
  next();
};

const authorizeSelfOrAdmin = (paramUserId = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized. Please log in.', 401));
    }
    if (req.user._id.toString() !== req.params[paramUserId] && !['tenant_admin', 'superadmin'].includes(req.user.role)) {
      return next(new AppError('You can only access your own resources.', 403));
    }
    next();
  };
};

const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('Not authorized.', 401));
    }
    const permissions = {
      superadmin: ['*'],
      tenant_admin: [
        'manage_tenants', 'manage_vendors', 'manage_products', 'manage_orders',
        'manage_users', 'manage_settings', 'view_analytics', 'manage_payments',
      ],
      vendor: [
        'manage_products', 'manage_orders', 'view_analytics',
      ],
      customer: ['view_products', 'manage_cart', 'manage_orders'],
      delivery_driver: ['view_deliveries', 'update_delivery_status'],
    };
    const userPermissions = permissions[req.user.role] || [];
    if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
      return next(new AppError('Insufficient permissions.', 403));
    }
    next();
  };
};

module.exports = {
  authorize,
  authorizeVendor,
  authorizeAdmin,
  authorizeSuperAdmin,
  authorizeSelfOrAdmin,
  checkPermission,
};
