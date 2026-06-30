const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const reviewController = require('../reviewController');

// إضافة أو تحديث مراجعة للدورة (للطلاب المسجلين فقط)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.post('/:courseId', protect, reviewController.addOrUpdateReview);

// جلب جميع مراجعات الدورة (مع التقييم المتوسط)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/:courseId', reviewController.getReviewsForCourse);

// جلب مراجعة المستخدم المسجل لدورة معينة
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/:courseId/mine', protect, reviewController.getMyReview);

// حذف مراجعة
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.delete('/:courseId', protect, reviewController.deleteMyReview);

// المسؤول: حذف أي مراجعة
// هني نستقبل تقييم الرجال، عساه يعطينا خمس نجوم وما يكسر بخاطرنا
router.delete('/admin/:reviewId', protect, reviewController.deleteReviewAdmin);

module.exports = router;
