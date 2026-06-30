const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const certificateController = require('../certificateController');

// إصدار شهادة جديدة للمستخدم المسجل دخوله
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.post('/', protect, certificateController.issueCertificate);

// جلب جميع شهادات المستخدم المسجل دخوله
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.get('/me', protect, certificateController.getMyCertificates);

module.exports = router;
