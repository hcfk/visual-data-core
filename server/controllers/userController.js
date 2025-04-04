const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger'); // Import your Winston logger

// Register a new user
const registerUser = async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Validate user input
        if (!username || !password || !email) {
            logger.warn('Validation failed during registration: Missing required fields');
            return res.status(400).json({ error: 'Tüm alanlar gerekli' });
        }

        // Check if username or email already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            const conflictField = existingUser.username === username ? 'Username' : 'Email';
            logger.info(`Registration failed: ${conflictField} "${conflictField === 'Username' ? username : email}" already exists`);
            return res.status(409).json({ error: `${conflictField} zaten kayıtlı` });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user with `isActive` field set to true
        const newUser = new User({
            username,
            password: hashedPassword,
            email,
            isActive: true, // default to true; can adjust based on your requirements
        });

        await newUser.save();
        logger.info(`User "${username}" registered successfully with email "${email}"`);
        res.status(201).json({ message: 'Kullanıcı kaydı başarılı.' });
    } catch (error) {
        logger.error('Error during user registration', { message: error.message, stack: error.stack });
        res.status(500).json({ error: 'Kayıt esnasında bir hata oluştu.Lütfen tekrar deneyin.' });
    }
};



// Login a user
const loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate user input
        if (!username || !password) {
            logger.warn('Login failed: Missing username or password');
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find the user
        const user = await User.findOne({ username });
        if (!user) {
            logger.warn(`Login failed: Username "${username}" not found`);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check if the password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            logger.warn(`Login failed: Incorrect password for username "${username}"`);
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate a JWT token
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        logger.info(`User "${username}" logged in successfully`);
        res.json({ token });
    } catch (error) {
        logger.error('Error during user login:', { message: error.message, stack: error.stack });
        res.status(500).json({ error: 'An error occurred during login. Please try again later.' });
    }
};

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        // Assuming `req.user` contains the authenticated user's ID (set by authentication middleware)
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            logger.warn(`Profile fetch failed: User ID "${req.user.id}" not found`);
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info(`User profile for ID "${req.user.id}" retrieved successfully`);
        res.json(user);
    } catch (error) {
        logger.error('Error fetching user profile:', { message: error.message, stack: error.stack });
        res.status(500).json({ error: 'An error occurred while retrieving the profile. Please try again later.' });
    }
};

module.exports = { registerUser, loginUser, getUserProfile };
