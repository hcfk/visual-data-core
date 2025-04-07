import { Schema, model } from 'mongoose'
import logger from '../utils/logger.js' // Updated import

const UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'contentadmin', 'normal'], default: 'normal' },
  telegram_username: { type: String },
  whatsapp_number: { type: String },
  isActive: { type: Boolean, default: true }
}, { timestamps: true })

UserSchema.post('save', function (doc) {
  logger.info('New user created', {
    userId: doc._id,
    username: doc.username,
    role: doc.role,
    email: doc.email,
    isActive: doc.isActive,
  })
})

UserSchema.post('findOneAndUpdate', function (doc) {
  if (doc) {
    logger.info('User updated', {
      userId: doc._id,
      username: doc.username,
      role: doc.role,
      email: doc.email,
      isActive: doc.isActive,
    })
  } else {
    logger.warn('User update attempted but no user found')
  }
})

UserSchema.post('findOneAndRemove', function (doc) {
  if (doc) {
    logger.info('User deleted', {
      userId: doc._id,
      username: doc.username,
      role: doc.role,
      email: doc.email,
      isActive: doc.isActive,
    })
  } else {
    logger.warn('User deletion attempted but no user found')
  }
})

// Error-handling middleware
UserSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    logger.error('Duplicate key error during user save:', {
      message: error.message,
      keys: error.keyValue,
    })
    next(new Error('A user with this username or email already exists.'))
  } else {
    logger.error('Error during user save operation:', { error })
    next(error)
  }
})

UserSchema.post('findOneAndUpdate', function (error, doc, next) {
  if (error) {
    logger.error('Error during user update operation:', { error })
    next(error)
  }
})

UserSchema.post('findOneAndRemove', function (error, doc, next) {
  if (error) {
    logger.error('Error during user deletion operation:', { error })
    next(error)
  }
})

const User = model('User', UserSchema)
export default User
