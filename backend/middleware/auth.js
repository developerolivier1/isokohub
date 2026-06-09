const jwt = require('jsonwebtoken');
const { AppError, asyncHandler } = require('./error');
const User = require('../models/User');
const logger = require('../utils/logger');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('Not authorized. Please log in to access this resource.', 401, 'NOT_AUTHENTICATED'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new AppError('User belonging to this token no longer exists.', 401, 'USER_NOT_FOUND'));
    }

    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 401, 'ACCOUNT_DEACTIVATED'));
    }

    if (user.passwordChangedAt && decoded.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
      return next(new AppError('Password recently changed. Please log in again.', 401, 'PASSWORD_CHANGED'));
    }

    req.user = user;
    req.tenantId = user.tenantId;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired. Please log in again.', 401, 'TOKEN_EXPIRED'));
    }
    return next(new AppError('Authentication failed.', 401, 'AUTH_FAILED'));
  }
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user = user;
        req.tenantId = user.tenantId;
      }
    } catch (error) {
      // Silent fail for optional auth
    }
  }
  next();
});

const generateToken = (userId, tenantId, role) => {
  return jwt.sign(
    { id: userId, tenantId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d' }
  );
};

const setTokenCookie = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: parseInt(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000 || 7 * 24 * 60 * 60 * 1000,
  };
  res.cookie('token', token, cookieOptions);
};

const clearTokenCookie = (res) => {
  res.cookie('token', 'none', {
    httpOnly: true,
    expires: new Date(Date.now() + 5 * 1000),
  });
};

module.exports = {
  protect,
  optionalAuth,
  generateToken,
  generateRefreshToken,
  setTokenCookie,
  clearTokenCookie,
};
