const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
    statusCode: 404
  });
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);

  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error] ${req.method} ${req.originalUrl} (${statusCode}):`, err.message);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    requiresEmailVerification: err.requiresEmailVerification || undefined,
    statusCode,
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
