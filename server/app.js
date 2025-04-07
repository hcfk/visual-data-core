import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import winston from 'winston'
import http from 'http'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Custom imports (ensure all use `export default`)
import authRoutes from './routes/authRoutes.js'
import userRoutes from './routes/userRoutes.js'
import errorHandler from './middleware/errorMiddleware.js'

// ESModule fix for __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, 'uploads')

// Load environment variables
const ENV = process.env.NODE_ENV || 'development'
dotenv.config()

console.log('Environment:', ENV)
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vdcDB'

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
})

// Ensure uploads directory exists

// Init Express
const app = express()

// CORS setup
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true)
      return callback(null, true)
    },
    optionsSuccessStatus: 200,
  })
)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Request logger middleware
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url} from IP ${req.ip}`)
  next()
})

// Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)

// MongoDB connection
mongoose
  .connect(mongoURI)
  .then(() => logger.info('✅ Connected to MongoDB'))
  .catch((error) => {
    logger.error('MongoDB connection error:', {
      message: error.message,
      stack: error.stack,
    })
    process.exit(1)
  })

// Central error handler
app.use((err, req, res, next) => {
  logger.error(`Error occurred: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  })
  errorHandler(err, req, res, next)
})

// Start HTTP server
const PORT = process.env.PORT || 5005
http.createServer(app).listen(PORT, () => {
  logger.info(`🚀 Server running on http://0.0.0.0:${PORT}`)
})
