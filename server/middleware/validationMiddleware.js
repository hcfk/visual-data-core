import { body, validationResult } from 'express-validator'
import logger from '../utils/logger.js'

export const validateUser = [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      logger.warn('Validation failed for user input', {
        ip: req.ip,
        user: req.user ? req.user.id : 'anonymous',
        errors: errors.array(),
      })
      return res.status(400).json({ errors: errors.array() })
    }

    logger.info('Validation passed for user input', {
      ip: req.ip,
      user: req.user ? req.user.id : 'anonymous',
      body: {
        email: req.body.email,
        // Do not log passwords for security reasons
      },
    })

    next()
  },
]
