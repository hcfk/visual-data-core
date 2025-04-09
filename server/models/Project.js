// models/Project.js
import { Schema, model, Types } from 'mongoose'
import logger from '../utils/logger.js'

const SubProjectSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
})

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    creator: { type: Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        userId: { type: Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['projectadmin', 'projectuser'], default: 'projectuser' },
      },
    ],
    subProjects: [SubProjectSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

// Logging
ProjectSchema.post('save', function (doc) {
  logger.info('New project created', {
    projectId: doc._id,
    name: doc.name,
    creator: doc.creator,
    isActive: doc.isActive,
  })
})

ProjectSchema.post('findOneAndUpdate', function (doc) {
  if (doc) {
    logger.info('Project updated', {
      projectId: doc._id,
      name: doc.name,
      isActive: doc.isActive,
    })
  } else {
    logger.warn('Project update attempted but no project found')
  }
})

ProjectSchema.post('findOneAndRemove', function (doc) {
  if (doc) {
    logger.info('Project deleted', {
      projectId: doc._id,
      name: doc.name,
    })
  } else {
    logger.warn('Project deletion attempted but no project found')
  }
})

// Error handling
ProjectSchema.post('save', function (error, doc, next) {
  if (error.name === 'MongoError' && error.code === 11000) {
    logger.error('Duplicate key error during project save:', {
      message: error.message,
      keys: error.keyValue,
    })
    next(new Error('A project with this name already exists.'))
  } else {
    logger.error('Error during project save operation:', { error })
    next(error)
  }
})

ProjectSchema.post('findOneAndUpdate', function (error, doc, next) {
  if (error) {
    logger.error('Error during project update operation:', { error })
    next(error)
  }
})

ProjectSchema.post('findOneAndRemove', function (error, doc, next) {
  if (error) {
    logger.error('Error during project deletion operation:', { error })
    next(error)
  }
})

export default model('Project', ProjectSchema)
