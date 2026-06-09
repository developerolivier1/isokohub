const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, errorCode = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_ID');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `Duplicate value for ${field}: "${value}". Please use another value.`;
  return new AppError(message, 409, 'DUPLICATE_FIELD');
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(e => e.message);
  const message = `Validation error: ${errors.join('. ')}`;
  return new AppError(message, 400, 'VALIDATION_ERROR');
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401, 'INVALID_TOKEN');
const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401, 'TOKEN_EXPIRED');

const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message, stack: err.stack };

  logger.error(`${err.statusCode || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (process.env.NODE_ENV !== 'production') {
    logger.debug(err.stack);
  }

  if (err.name === 'CastError') error = handleCastErrorDB(err);
  if (err.code === 11000) error = handleDuplicateFieldsDB(err);
  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);
  if (err.name === 'JsonWebTokenError') error = handleJWTError();
  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError();

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = new AppError('File too large. Maximum size is 5MB.', 400, 'FILE_TOO_LARGE');
    }
    error = new AppError(err.message, 400, 'UPLOAD_ERROR');
  }

  if (err.code === 'ENOENT') {
    error = new AppError('Resource not found.', 404, 'NOT_FOUND');
  }

  const statusCode = error.statusCode || 500;
  const response = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.errorCode || 'INTERNAL_ERROR',
    },
  };

  if (statusCode === 422 || (error.errors && Array.isArray(error.errors))) {
    response.error.details = error.errors || [];
  }

  if (process.env.NODE_ENV !== 'production') {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route not found: ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND');
  next(error);
};

const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  globalErrorHandler,
  notFoundHandler,
  asyncHandler,
};
