const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const winston = require('winston');
const http = require('http'); // For HTTP support
const ensureDirectoryExists = require('./utils/checkDirectory');
const authRoutes = require('./routes/authRoutes'); 
const fileQueueRoutes = require('./routes/fileQueueRoutes');
const errorHandler = require('./middleware/errorMiddleware');
const fileRoutes = require('./routes/fileRoutes');
const notifierRoutes = require('./routes/notifierRoutes');
const userRoutes = require('./routes/userRoutes');
const  chatRoutes = require('./routes/chatRoutes');
const  mediaStatisticsRoutes = require('./routes/mediaStatisticsRoutes')
// Import services to initialize
require('./services/telegramBotService');
require('./services/mp3fileQueueProcessor');
require('./services/transcribingService');
require('./services/youtubeDownloadService');
// const fs = require('fs');

// Load environment variables depending on development or production
const ENV = process.env.NODE_ENV || 'development';
//const envFilePath = `.env.${ENV}`;
//if (fs.existsSync(envFilePath)) {
//  dotenv.config({ envFilePath: `.env.${ENV}` }) || dotenv.config();
//} else {
  dotenv.config(); // Fallback to default .env if specific file not found
//}

console.log('Environment:', ENV);
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mCMSDB';
const uploadsDir = process.env.UPLOADS_DIR || 'uploads';

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
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Check and create the uploads directory if needed
try {
  ensureDirectoryExists(uploadsDir);
} catch (error) {
  logger.error('Error ensuring uploads directory exists:', { message: error.message, stack: error.stack });
  process.exit(1); // Exit if uploads directory setup fails
}

// Initialize Express app
const app = express();
//const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [];

// Middleware
const cors = require('cors');
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    //if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    //} else {
    //  return callback(new Error('Not allowed by CORS'));
    //}
  },
  optionsSuccessStatus: 200,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all incoming requests
app.use((req, res, next) => {
  logger.info(`Incoming request: ${req.method} ${req.url} from IP ${req.ip}`);
  next();
}); 

// Route setup
app.use('/api/v1/files', fileRoutes);
app.use('/api/v1/auth', authRoutes);  
app.use('/api/v1/queues', fileQueueRoutes);
app.use('/api/v1/statistic', mediaStatisticsRoutes);
//app.use('/api/youtube', youtubeRoutes);
app.use('/api/v1/notifiers', notifierRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/chat', chatRoutes);

// MongoDB connection
mongoose.connect(mongoURI, {})
  .then(() => logger.info('Connected to MongoDB'))
  .catch((error) => {
    logger.error('MongoDB connection error:', { message: error.message, stack: error.stack });
    process.exit(1); // Exit if MongoDB connection fails
  });

// Centralized error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error occurred: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });
  errorHandler(err, req, res, next);
});

// HTTPS Server Configuration
// const PORT = process.env.PORT || 5000;
// const options = {
//   key: fs.readFileSync('server.key'),
//   cert: fs.readFileSync('server.cert'),
// };
// logger.info('HTTPS key and certificate loaded successfully');
// // Start HTTPS server
// https.createServer(options, app).listen(PORT, () => {
//   logger.info(`Server running on http://0.0.0.0:${PORT}`);
// });

const PORT = process.env.PORT || 5000;
// Start HTTP server
http.createServer(app).listen(PORT, () => {
  logger.info(`Server running on http://0.0.0.0:${PORT}`);
});

module.exports = app;
