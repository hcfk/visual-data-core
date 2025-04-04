const logger = require('../utils/logger'); // Import the logger utility

const errorHandler = (err, req, res, next) => {
  // Log the error using Winston
  logger.error('Error encountered', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Respond to the client
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode; // Ensure status code is 500 if not set
  res.status(statusCode).json({
    message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : err.message,
  });
};

module.exports = errorHandler;
