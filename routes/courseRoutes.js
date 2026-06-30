const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer'); // مكتبة لرفع الملفات (صور وفيديوهات)
const { protect } = require('../middlewares/authMiddleware'); // ميدل وير للتحقق من تسجيل الدخول
const courseController = require('../courseController'); // استدعاء متحكم الكورسات

// ─── إعداد مجلدات رفع الملفات ─────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
const coursesDir = path.join(uploadsDir, 'courses'); // مسار حفظ الفيديوهات
const thumbnailsDir = path.join(uploadsDir, 'thumbnails'); // مسار حفظ الصور المصغرة للكورسات
// إنشاء المجلدات إن لم تكن موجودة
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(coursesDir)) fs.mkdirSync(coursesDir);
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir);

// ─── إعدادات Multer: لرفع الصور المصغرة (Thumbnails) ─────────────────────────────────────────────────
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, thumbnailsDir), // تحديد مجلد الصور
    filename: (req, file, cb) => cb(null, 'thumb-' + Date.now() + path.extname(file.originalname)) // إعطاء اسم فريد بناءً على الوقت
});
const uploadThumbnail = multer({
    storage: thumbnailStorage,
    fileFilter: (req, file, cb) => {
        // السماح بامتدادات الصور فقط
        const allowed = /jpeg|jpg|png|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for thumbnails'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // الحد الأقصى 5 ميجابايت
});

// ─── إعدادات Multer: لرفع الفيديوهات ─────────────────────────────────────────────────────
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const courseId = req.params.courseId; // جلب الـ ID الخاص بالكورس من الرابط
        const courseVideoPath = path.join(coursesDir, courseId.toString());
        // التأكد من وجود مجلد فرعي باسم رقم الكورس لتنظيم الفيديوهات
        if (!fs.existsSync(courseVideoPath)) fs.mkdirSync(courseVideoPath, { recursive: true });
        cb(null, courseVideoPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // اسم فريد للفيديو
    }
});
const uploadVideo = multer({ storage: videoStorage });

// ─── مسارات الكورسات (Routes) ───────────────────────────────────────────────────────────────────

// إنشاء كورس جديد (مسموح للمحاضر أو الأدمن فقط) - يمر على التحقق ثم رفع الصورة ثم الكنترولر
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.post('/', protect, uploadThumbnail.single('thumbnail'), courseController.createCourse);

// جلب جميع الكورسات (متاح للعامة بدون تسجيل دخول)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/', courseController.getCourses);

// جلب الكورسات التي قام المحاضر بإنشائها (خاص بالمحاضرين)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/mycourses', protect, courseController.getMyCourses);

// جلب بيانات كورس معين (متاح للعامة لمشاهدة تفاصيل الكورس قبل الاشتراك)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/:courseId', courseController.getCourseById);

// تحديث بيانات كورس معين (خاص بصاحب الكورس)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.put('/:courseId', protect, uploadThumbnail.single('thumbnail'), courseController.updateCourse);

// حذف كورس (مسموح لصاحب الكورس أو الأدمن)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.delete('/:courseId', protect, courseController.deleteCourse);

// اشتراك المستخدم في الكورس (يتطلب تسجيل الدخول)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.post('/:courseId/enroll', protect, courseController.enrollCourse);

// جلب قائمة الطلاب المشتركين في الكورس (خاص بصاحب الكورس)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/:courseId/students', protect, courseController.getEnrolledStudents);

// رفع فيديو جديد داخل كورس معين (خاص بصاحب الكورس)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.post('/:courseId/videos', protect, uploadVideo.single('video'), courseController.uploadVideo);

// حذف فيديو من كورس (خاص بصاحب الكورس)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.delete('/:courseId/videos/:videoId', protect, courseController.deleteVideo);

module.exports = router;
