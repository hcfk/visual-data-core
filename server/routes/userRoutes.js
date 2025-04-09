import express from 'express'
import bcrypt from 'bcryptjs'
import User from '../models/User.js'
import authMiddleware from '../middleware/authMiddleware.js'
import logger from '../utils/logger.js'

const router = express.Router()

// GET current user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
    if (!user) {
      logger.warn('User not found', { userId: req.user.id })
      return res.status(404).json({ message: 'User not found.' })
    }

    res.json({ user })
  } catch (error) {
    logger.error('Error fetching profile', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'An error occurred while retrieving the profile.' })
  }
})

// PUT update user profile (admin)
router.put('/update-user/:user_id', authMiddleware, async (req, res) => {
  logger.info('Update user attempt', { userId: req.params.user_id })

  try {
    const { username, email, role, isActive } = req.body

    const updatedUser = await User.findByIdAndUpdate(
      req.params.user_id,
      { username, email, role, isActive },
      { new: true, runValidators: true }
    )

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    res.json({ message: 'User updated successfully.', user: updatedUser })
  } catch (error) {
    logger.error('Error updating user', {
      userId: req.params.user_id,
      error: error.message,
    })
    res.status(500).json({ error: 'An error occurred while updating the user.' })
  }
})

// PUT set password (admin only)
router.put('/users/:id/set-password', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { newPassword } = req.body

  if (req.user.role !== 'admin') {
    logger.warn('Unauthorized password reset attempt', { by: req.user.id })
    return res.status(403).json({ message: 'Access denied.' })
  }

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' })
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    const updatedUser = await User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true })
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' })
    }

    logger.info('Admin updated password', { adminId: req.user.id, userId: id })
    res.json({ message: 'Password updated successfully.' })
  } catch (error) {
    logger.error('Error setting password', { error: error.message })
    res.status(500).json({ error: 'An error occurred while setting the password.' })
  }
})

// PUT change own password
router.put('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.user.id

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required.' })
  }

  try {
    const user = await User.findById(userId)
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const isMatch = await bcrypt.compare(currentPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password is incorrect.' })
    }

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    logger.info('User changed password', { userId })
    res.json({ message: 'Password updated successfully.' })
  } catch (error) {
    logger.error('Error changing password', {
      userId,
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'An error occurred while changing the password.' })
  }
})

// GET all users (admin only)
router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    logger.warn('Unauthorized user list attempt', { by: req.user.id })
    return res.status(403).json({ error: 'You are not authorized to perform this action.' })
  }

  try {
    const users = await User.find().select('-password')
    res.json(users)
  } catch (error) {
    logger.error('Error fetching users', {
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'An error occurred while fetching users.' })
  }
})

// PUT activate/deactivate user (admin only)
router.put('/admin/users/:id/activate', authMiddleware, async (req, res) => {
  const { id } = req.params
  const { isActive } = req.body

  if (req.user.role !== 'admin') {
    logger.warn('Unauthorized activation change attempt', { by: req.user.id })
    return res.status(403).json({ error: 'You are not authorized to perform this action.' })
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(id, { isActive }, { new: true, runValidators: true })
    if (!updatedUser) {
      logger.warn('User not found for activation update', { id })
      return res.status(404).json({ error: 'User not found.' })
    }

    logger.info('User activation status updated', {
      adminId: req.user.id,
      userId: id,
      isActive,
    })

    res.json({
      message: `User has been ${isActive ? 'activated' : 'deactivated'}.`,
      user: updatedUser,
    })
  } catch (error) {
    logger.error('Error updating activation status', {
      userId: id,
      error: error.message,
      stack: error.stack,
    })
    res.status(500).json({ error: 'An error occurred while updating user status.' })
  }
})

export default router
