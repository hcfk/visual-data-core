const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // Import the logger utility

// Middleware to authenticate and verify the JWT token
const authMiddleware = (req, res, next) => {
  const authHeader = req.header('Authorization');
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    logger.warn('Authorization attempt without token', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure `role` and `isActive` are part of the token payload
    if (!decoded.role || decoded.isActive === undefined) {
      logger.warn('Token does not contain user role or isActive status', {
        userId: decoded.id,
        ip: req.ip,
        url: req.originalUrl,
      });
      return res.status(403).json({ message: 'Invalid token structure' });
    }

    // Check if the user is active
    if (!decoded.isActive) {
      logger.warn('Access attempt by inactive user', { userId: decoded.id });
      return res.status(403).json({ message: 'Your account is inactive. Please contact support.' });
    }

    req.user = decoded; // Attach the decoded user information to the request object

    logger.info('Authorization successful', {
      userId: decoded.id,
      role: decoded.role,
      isActive: decoded.isActive,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });

    next(); // Proceed to the next middleware or route handler

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired', {
        error: error.message,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });
      return res.status(401).json({ message: 'Token has expired, please log in again' });
    } else if (error.name === 'JsonWebTokenError') {
      logger.error('Invalid token detected', {
        error: error.message,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });
      return res.status(401).json({ message: 'Invalid token, authorization denied' });
    } else {
      logger.error('Token verification error', {
        error: error.message,
        stack: error.stack,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });
      return res.status(500).json({ message: 'An internal server error occurred during token verification' });
    }
  }
};

module.exports = authMiddleware;
