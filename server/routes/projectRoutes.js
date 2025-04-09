// routes/projectRoutes.js
import express from 'express'
import authMiddleware from '../middleware/authMiddleware.js'
import Project from '../models/Project.js'
import User from '../models/User.js'
import logger from '../utils/logger.js'

const router = express.Router()

// Create a new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body
    const creatorId = req.user.id

    const newProject = await Project.create({
      name,
      description,
      creator: creatorId,
      members: [{ userId: creatorId, role: 'projectadmin' }],
    })

    logger.info('Project created', { projectId: newProject._id, creatorId })
    res.status(201).json({ message: 'Project created successfully', project: newProject })
  } catch (error) {
    logger.error('Error creating project', { error: error.message, stack: error.stack })
    res.status(500).json({ message: 'An error occurred while creating the project' })
  }
})

// Get all projects user is part of
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id
    const projects = await Project.find({ 'members.userId': userId })
    res.json({ projects })
  } catch (error) {
    logger.error('Error fetching projects', { error: error.message })
    res.status(500).json({ message: 'An error occurred while fetching projects' })
  }
})

// Get single project by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)

    if (!project) {
      return res.status(404).json({ message: 'Project not found' })
    }

    const isMember = project.members.some(m => m.userId.toString() === req.user.id)
    if (!isMember && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' })
    }

    res.json({ project })
  } catch (error) {
    logger.error('Error fetching project', { error: error.message })
    res.status(500).json({ message: 'An error occurred while fetching the project' })
  }
})

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, isActive } = req.body
    const project = await Project.findById(req.params.id)

    if (!project) return res.status(404).json({ message: 'Project not found' })

    const member = project.members.find(m => m.userId.toString() === req.user.id)
    if (!member || member.role !== 'projectadmin') {
      return res.status(403).json({ message: 'Only project admins can update project' })
    }

    project.name = name || project.name
    project.description = description || project.description
    if (isActive !== undefined) project.isActive = isActive

    await project.save()
    res.json({ message: 'Project updated', project })
  } catch (error) {
    logger.error('Error updating project', { error: error.message })
    res.status(500).json({ message: 'An error occurred while updating the project' })
  }
})

// Delete a project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const member = project.members.find(m => m.userId.toString() === req.user.id)
    if (!member || member.role !== 'projectadmin') {
      return res.status(403).json({ message: 'Only project admins can delete project' })
    }

    await project.deleteOne()
    res.json({ message: 'Project deleted successfully' })
  } catch (error) {
    logger.error('Error deleting project', { error: error.message })
    res.status(500).json({ message: 'An error occurred while deleting the project' })
  }
})

// Add member to project
router.post('/:id/invite', authMiddleware, async (req, res) => {
  try {
    const { username, role = 'projectuser' } = req.body
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const isAdmin = project.members.some(m => m.userId.toString() === req.user.id && m.role === 'projectadmin')
    if (!isAdmin) return res.status(403).json({ message: 'Only project admins can invite users' })

    const user = await User.findOne({ username })
    if (!user) return res.status(404).json({ message: 'User not found' })

    const alreadyMember = project.members.some(m => m.userId.toString() === user._id.toString())
    if (alreadyMember) return res.status(400).json({ message: 'User is already a project member' })

    project.members.push({ userId: user._id, role })
    await project.save()

    logger.info('User added to project', { projectId: project._id, userId: user._id, role })
    res.json({ message: 'User added to project', project })
  } catch (error) {
    logger.error('Error inviting user to project', { error: error.message })
    res.status(500).json({ message: 'An error occurred while inviting user to project' })
  }
})

// Update member role
router.put('/:projectId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const { role } = req.body
    const project = await Project.findById(req.params.projectId)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const isAdmin = project.members.some(m => m.userId.toString() === req.user.id && m.role === 'projectadmin')
    if (!isAdmin) return res.status(403).json({ message: 'Only project admins can update roles' })

    const member = project.members.find(m => m.userId.toString() === req.params.memberId)
    if (!member) return res.status(404).json({ message: 'Member not found' })

    member.role = role
    await project.save()
    res.json({ message: 'Member role updated', project })
  } catch (error) {
    logger.error('Error updating member role', { error: error.message })
    res.status(500).json({ message: 'An error occurred while updating member role' })
  }
})

// Remove member from project
router.delete('/:projectId/members/:memberId', authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const isAdmin = project.members.some(m => m.userId.toString() === req.user.id && m.role === 'projectadmin')
    if (!isAdmin) return res.status(403).json({ message: 'Only project admins can remove members' })

    project.members = project.members.filter(m => m.userId.toString() !== req.params.memberId)
    await project.save()
    res.json({ message: 'Member removed from project', project })
  } catch (error) {
    logger.error('Error removing member', { error: error.message })
    res.status(500).json({ message: 'An error occurred while removing member from project' })
  }
})

// Add a sub-project
router.post('/:id/subprojects', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const isAdmin = project.members.some(m => m.userId.toString() === req.user.id && m.role === 'projectadmin')
    if (!isAdmin) return res.status(403).json({ message: 'Only project admins can add sub-projects' })

    project.subProjects.push({ name, description })
    await project.save()
    res.status(201).json({ message: 'Sub-project added', project })
  } catch (error) {
    logger.error('Error adding sub-project', { error: error.message })
    res.status(500).json({ message: 'An error occurred while adding sub-project' })
  }
})

// Update a sub-project
router.put('/:projectId/subprojects/:subId', authMiddleware, async (req, res) => {
  try {
    const { name, description, isActive } = req.body
    const project = await Project.findById(req.params.projectId)
    if (!project) return res.status(404).json({ message: 'Project not found' })

    const sub = project.subProjects.id(req.params.subId)
    if (!sub) return res.status(404).json({ message: 'Sub-project not found' })

    if (!project.members.some(m => m.userId.toString() === req.user.id && m.role === 'projectadmin')) {
      return res.status(403).json({ message: 'Only project admins can update sub-projects' })
    }

    sub.name = name || sub.name
    sub.description = description || sub.description
    if (isActive !== undefined) sub.isActive = isActive

    await project.save()
    res.json({ message: 'Sub-project updated', project })
  } catch (error) {
    logger.error('Error updating sub-project', { error: error.message })
    res.status(500).json({ message: 'An error occurred while updating sub-project' })
  }
})

// Delete a sub-project
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const project = await Project.findById(req.params.id)
      if (!project) return res.status(404).json({ message: 'Project not found' })
  
      const hasSubProjects = project.subProjects && project.subProjects.length > 0
      if (hasSubProjects) {
        return res.status(400).json({ message: 'Project cannot be deleted because it contains sub-projects' })
      }
  
      const member = project.members.find(m => m.userId.toString() === req.user.id)
      if (!member || member.role !== 'projectadmin') {
        return res.status(403).json({ message: 'Only project admins can delete project' })
      }
  
      await project.deleteOne()
      res.json({ message: 'Project deleted successfully' })
    } catch (error) {
      logger.error('Error deleting project', { error: error.message })
      res.status(500).json({ message: 'An error occurred while deleting the project' })
    }
  })

export default router;
