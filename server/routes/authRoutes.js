import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

import { registerUser, getUserProfile } from '../controllers/userController.js'
import authMiddleware from '../middleware/authMiddleware.js'
import { validateUser } from '../middleware/validationMiddleware.js'
import User from '../models/User.js'
import logger from '../utils/logger.js'

dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET
const router = express.Router()

// Middleware to log incoming requests
router.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`)
  next()
})

// Route for registering a user
router.post('/register', validateUser, async (req, res, next) => {
  try {
    await registerUser(req, res)
  } catch (error) {
    logger.error(`Error in /register route: ${error.message}`, { error })
    next(error)
  }
})

// Route for login
router.post('/login', async (req, res, next) => {
  const { username, password } = req.body

  try {
    if (!username || !password) {
      logger.warn('Login attempt failed: Missing username or password')
      return res.status(400).json({ message: 'Username and password are required.' })
    }

    logger.info(`Login Started authRoute`)

    const user = await User.findOne({ username })
    if (!user) {
      logger.warn(`Login failed for "${username}": User not found`)
      return res.status(401).json({ message: 'Invalid username or password.' })
    }

    if (!user.isActive) {
      logger.warn(`Login failed for "${username}": User inactive`)
      return res.status(403).json({ message: 'Your account is not active. Please contact support.' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      logger.warn(`Login failed for "${username}": Incorrect password`)
      return res.status(401).json({ message: 'Incorrect username or password.' })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, isActive: user.isActive },
      JWT_SECRET,
      { expiresIn: '1h' }
    )

    logger.info(`User "${username}" logged in`, {
      userId: user._id,
      role: user.role,
      isActive: user.isActive,
    })

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    logger.error(`Login error: ${error.message}`, { error })
    res.status(500).json({ message: 'An unexpected error occurred during login.' })
    next(error)
  }
})

// Route for profile
router.get('/profile', authMiddleware, async (req, res, next) => {
  try {
    await getUserProfile(req, res)
  } catch (error) {
    logger.error(`Error in /profile route: ${error.message}`, { error })
    next(error)
  }
})

export default router
