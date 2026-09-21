const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404,
    requestId: req.id || undefined
  });
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Internal Server Error';

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors?.map(e => e.message).join(', ') || 'Validation error';
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = err.errors?.map(e => `${e.path} already exists`).join(', ') || 'Record already exists';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired, please log in again';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] [${req.id || 'no-id'}] ${req.method} ${req.originalUrl} (${statusCode}):`, message);
    if (err.stack && statusCode === 500) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    requiresEmailVerification: err.requiresEmailVerification || undefined,
    statusCode,
    requestId: req.id || undefined,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
