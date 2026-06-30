const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const videoController = require('../videoController');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const videoStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const courseId = req.params.courseId;
        const dir = path.join(__dirname, '..', 'uploads', 'courses', courseId.toString());
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
        cb(null, safeName);
    }
});

const videoUpload = multer({
    storage: videoStorage,
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 ميجابايت كحد أقصى لكل فيديو
    fileFilter: (req, file, cb) => {
        const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/mkv', 'video/avi', 'video/quicktime'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
});

// الرفع الجماعي لعدة فيديوهات لدورة (للمدرب فقط)
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.post('/upload/:courseId', protect, videoUpload.array('videos', 20), videoController.uploadVideos);

// تحديد الفيديو كمكتمل للمستخدم
// هني المربط حق الفيديوهات، نشغل المقطع ونضبط الشاشة للربع
router.post('/:videoId/complete', protect, videoController.markVideoComplete);

// حذف فيديو (للمدرب فقط)
// هني المربط حق الفيديوهات، نشغل المقطع ونضبط الشاشة للربع
router.delete('/:videoId', protect, videoController.deleteVideo);

module.exports = router;
