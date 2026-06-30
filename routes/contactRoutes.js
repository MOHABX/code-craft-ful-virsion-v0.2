const express = require('express');
const router = express.Router();
const contactController = require('../contactController');

// إرسال رسالة تواصل (من نموذج التذييل)
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.post('/', contactController.submitContactMessage);

module.exports = router;
