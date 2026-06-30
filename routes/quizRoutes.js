const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const quizController = require('../quizController');

// إنشاء أسئلة اختبار بواسطة الذكاء الاصطناعي
// يا ويل اللي ما يذاكر! هذي الدالة حقت الاختبارات، نشوف من ينجح ومن يجيب العيد
router.get('/generate', protect, quizController.generateQuiz);

// إرسال إجابات الاختبار وحفظ النتيجة
// يا ويل اللي ما يذاكر! هذي الدالة حقت الاختبارات، نشوف من ينجح ومن يجيب العيد
router.post('/submit', protect, quizController.submitQuiz);

// جلب سجل نتائج الاختبارات للمستخدم المسجل دخوله
// يا ويل اللي ما يذاكر! هذي الدالة حقت الاختبارات، نشوف من ينجح ومن يجيب العيد
router.get('/results', protect, quizController.getQuizResults);

module.exports = router;
