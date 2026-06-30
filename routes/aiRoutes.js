const express = require('express');
const router = express.Router();
const { chat } = require('../aiController');
const { protect } = require('../middlewares/authMiddleware');

// @مسار   POST /api/ai/chat
// @وصف    الدردشة مع المساعد الذكي
// @صلاحية  خاص
// يا خوي هذي تفتح درب للمراسيل في السيرفر، نستقبل الطلب ونقضي اللزوم
router.post('/chat', protect, chat);

module.exports = router;
