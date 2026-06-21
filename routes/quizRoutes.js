const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const quizController = require('../quizController');

// Generate AI quiz questions
router.get('/generate', protect, quizController.generateQuiz);

// Submit quiz answers and save result
router.post('/submit', protect, quizController.submitQuiz);

// Get quiz results history for logged-in user
router.get('/results', protect, quizController.getQuizResults);

module.exports = router;
