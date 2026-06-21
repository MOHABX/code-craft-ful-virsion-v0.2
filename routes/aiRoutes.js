const express = require('express');
const router = express.Router();
const { chat } = require('../aiController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST /api/ai/chat
// @desc    Chat with AI Assistant
// @access  Private
router.post('/chat', protect, chat);

module.exports = router;
