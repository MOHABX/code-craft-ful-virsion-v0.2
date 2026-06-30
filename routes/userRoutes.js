const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const userController = require('../userController');

// جلب الدورات التي اشترك بها المستخدم
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/my-courses', protect, userController.getMyCourses);

// جلب الفيديوهات المكتملة للمستخدم لدورة معينة
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/progress/:courseId', protect, userController.getCourseProgress);

// جلب الملف الشخصي العام للمدرب مع دوراته والتقييمات
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.get('/instructor/:id', userController.getInstructorProfile);

// جلب إحصائيات لوحة التحكم للمستخدم
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.get('/dashboard', protect, userController.getDashboardStats);

module.exports = router;
