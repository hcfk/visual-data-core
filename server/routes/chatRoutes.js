// chatRoutes.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Import the auth middleware
const { generateText } = require('../services/gpt2Service'); // Import the service to generate text
const logger = require('../utils/logger'); // Import the logger utility

// Define a POST endpoint to generate text
router.post('/generate', authMiddleware, async (req, res) => {
  try {
    // Extract the prompt from the request body
    const { prompt } = req.body;

    // Use default values for maxLength and temperature
    const maxLength = 100; // Default maximum length for generated text
    const temperature = 0.7; // Default temperature for creativity

    // Log the incoming request for tracking
    logger.info('Text generation request received:', { prompt: prompt.substring(0, 50), maxLength, temperature });

    // Call the generateText service
    const generatedText = await generateText(prompt, maxLength, temperature);

    // Return the generated text to the frontend
    res.status(200).json({ text: generatedText });
  } catch (error) {
    // Log the error and send a response to the frontend
    logger.error('Error occurred during text generation:', { message: error.message });
    res.status(500).json({ error: 'An error occurred during text generation, please try again.' });
  }
});

module.exports = router;
