const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware'); // Authentication middleware
const logger = require('../utils/logger'); // Logger utility
const bcrypt = require('bcryptjs');

// Route to get user profile details
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find the user by ID, excluding the password field
    const user = await User.findById(userId).select('-password');
    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Error fetching profile:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Profil getirilirken bir hata oluştu.' });
  }
});

// Route to update user profile
router.put('/update-user/:user_id', authMiddleware, async (req, res) => {
  logger.info('Updating user profile');
  try {
    const { username, email, role, isActive, telegram_username, whatsapp_number } = req.body;

    // Validate the request body
    if (whatsapp_number && !/^\+\d{10,15}$/.test(whatsapp_number)) {
      return res.status(400).json({ message: 'WhatsApp numarası geçerli bir formatta olmalıdır. (ör. +1234567890)' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.user_id,
      { username, email, role, isActive, telegram_username, whatsapp_number },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'Kullanıcı Bulunamadı' });
    }

    res.json({ message: 'Kullanıcı başarılı şekilde güncellendi', user: updatedUser });
  } catch (error) {
    logger.error('Error updating user:', { error: error.message });
    res.status(500).json({ error: 'Kullanıcı güncellenirken bir hata oluştu' });
  }
});


router.put('/users/:id/set-password', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Only admins should be able to set or reset passwords for other users
    if (req.user.role !== 'admin') {
      logger.warn(`Unauthorized access attempt to set password for user ${id} by user ${req.user.id}`);
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { password: hashedPassword },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    logger.error('Error setting password:', { error: error.message });
    res.status(500).json({ error: 'An error occurred while setting password' });
  }
});
// Route to change user password
router.put('/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Eski ve yeni şifre gereklidir.' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Eski şifre yanlış.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    logger.info('Password updated successfully', { userId });
    res.json({ message: 'Şifre başarıyla güncellendi.' });
  } catch (error) {
    logger.error('Error changing password:', { error: error.message, stack: error.stack, userId });
    res.status(500).json({ error: 'Şifre güncellenirken bir hata oluştu.' });
  }
});

// Route to fetch all users (Admin only)
router.get('/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    logger.warn(`Unauthorized access attempt to fetch all users by user ${req.user.id}, role is ${req.user.role}`);
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
  }

  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    logger.error('Error fetching users:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Kullanıcılar getirilirken bir hata oluştu.' });
  }
});

// Route for admin to update a user's active status
router.put('/admin/users/:id/activate', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (req.user.role !== 'admin') {
    logger.warn(`Unauthorized access attempt by user ${req.user.id} to modify user ${id}`);
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      logger.warn(`User not found for activation status update: ${id}`);
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    logger.info(`User ${id} activation status updated successfully`, { isActive });
    res.json({
      message: `Kullanıcı ${isActive ? 'aktif' : 'pasif'} duruma getirildi.`,
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Error updating user activation status:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Kullanıcı durumu güncellenirken bir hata oluştu.' });
  }
});

module.exports = router;
