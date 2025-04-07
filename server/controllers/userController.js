import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import logger from '../utils/logger.js'

// Register a new user
export const registerUser = async (req, res) => {
  try {
    const { username, password, email } = req.body

    if (!username || !password || !email) {
      logger.warn('Validation failed during registration: Missing required fields')
      return res.status(400).json({ error: 'All fields are required.' })
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] })
    if (existingUser) {
      const conflictField = existingUser.username === username ? 'Username' : 'Email'
      logger.info(`Registration failed: ${conflictField} "${conflictField === 'Username' ? username : email}" already exists`)
      return res.status(409).json({ error: `${conflictField} is already registered.` })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      isActive: true,
    })

    await newUser.save()

    logger.info(`User "${username}" registered successfully with email "${email}"`)
    res.status(201).json({ message: 'User registered successfully.' })
  } catch (error) {
    logger.error('Error during user registration', {
      message: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'An error occurred during registration. Please try again later.' })
  }
}

// Login a user
export const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      logger.warn('Login failed: Missing username or password')
      return res.status(400).json({ error: 'Username and password are required.' })
    }

    const user = await User.findOne({ username })
    if (!user) {
      logger.warn(`Login failed: Username "${username}" not found`)
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    if (!user.isActive) {
      logger.warn(`Login failed: User "${username}" is inactive`)
      return res.status(403).json({ error: 'Your account is inactive. Please contact support.' })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      logger.warn(`Login failed: Incorrect password for username "${username}"`)
      return res.status(401).json({ error: 'Invalid username or password.' })
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, isActive: user.isActive },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )

    logger.info(`User "${username}" logged in successfully`)
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
    logger.error('Error during user login:', { message: error.message, stack: error.stack })
    res.status(500).json({ error: 'An error occurred during login. Please try again later.' })
  }
}

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')

    if (!user) {
      logger.warn(`Profile fetch failed: User ID "${req.user.id}" not found`)
      return res.status(404).json({ error: 'User not found.' })
    }

    logger.info(`User profile for ID "${req.user.id}" retrieved successfully`)
    res.json(user)
  } catch (error) {
    logger.error('Error fetching user profile:', {
      message: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'An error occurred while retrieving the profile. Please try again later.' })
  }
}
