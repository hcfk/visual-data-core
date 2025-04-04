const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { registerUser, getUserProfile } = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware'); // Corrected import for `authMiddleware`
const { validateUser } = require('../middleware/validationMiddleware');
const User = require('../models/User');
const logger = require('../utils/logger');
const dotenv = require('dotenv');
dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;
const router = express.Router();

// Middleware to log incoming requests
router.use((req, res, next) => {
    logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
    next();
});

// Route for registering a user
router.post('/register', validateUser, async (req, res, next) => {
    try {
        await registerUser(req, res);
    } catch (error) {
        logger.error(`Error in /register route: ${error.message}`, { error });
        next(error);
    }
});

// Route for user login (authMiddleware is not needed here; login logic checks user credentials)
router.post('/login', async (req, res, next) => {
    const { username, password } = req.body;

    try {
        if (!username || !password) {
            logger.warn('Login attempt failed: Missing username or password');
            return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir.' });
        }
        logger.info(`Login Started authRoute`);

        const user = await User.findOne({ username });
        if (!user) {
            logger.warn(`Login failed for username "${username}": User not found`);
            return res.status(401).json({ message: 'Hatalı kullanıcı adı veya şifre.' });
        }
        logger.info(`User Found authRoute`);

        // Check if the user account is active
        if (!user.isActive) {
            logger.warn(`Login failed for username "${username}": User account is inactive`);
            return res.status(403).json({ message: 'Hesabınız aktif değil. Lütfen destek ile iletişime geçin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`Login failed for username "${username}": Incorrect password`);
            return res.status(401).json({ message: 'Hatalı kullanıcı adı veya şifre.' });
        }
        logger.info(`Password OK authRoute`);

        // Generate a JWT token, including id, role, and isActive in the payload
        const token = jwt.sign(
            { id: user._id, role: user.role, isActive: user.isActive },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        logger.info(`User "${username}" logged in successfully`, {
            userId: user._id,
            role: user.role,
            isActive: user.isActive,
        });

        // Send the token and user information back to the frontend
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
        });
    } catch (error) {
        logger.error(`Error in /login route: ${error.message}`, { error });
        res.status(500).json({ message: 'An unexpected error occurred during login. Please try again later.' });
        next(error);
    }
});

// Route for getting user profile (protected by `authMiddleware`)
router.get('/profile', authMiddleware, async (req, res, next) => {
    try {
        await getUserProfile(req, res);
    } catch (error) {
        logger.error(`Error in /profile route: ${error.message}`, { error });
        next(error);
    }
});

module.exports = router;
