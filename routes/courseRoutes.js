const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { protect } = require('../middlewares/authMiddleware');
const courseController = require('../courseController');

// ─── Directory Setup ─────────────────────────────────────────────────────────
const uploadsDir = path.join(__dirname, '..', 'uploads');
const coursesDir = path.join(uploadsDir, 'courses');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
if (!fs.existsSync(coursesDir)) fs.mkdirSync(coursesDir);
if (!fs.existsSync(thumbnailsDir)) fs.mkdirSync(thumbnailsDir);

// ─── Multer: Thumbnail Upload ─────────────────────────────────────────────────
const thumbnailStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, thumbnailsDir),
    filename: (req, file, cb) => cb(null, 'thumb-' + Date.now() + path.extname(file.originalname))
});
const uploadThumbnail = multer({
    storage: thumbnailStorage,
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed for thumbnails'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
});

// ─── Multer: Video Upload ─────────────────────────────────────────────────────
const videoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        const courseId = req.params.courseId;
        const courseVideoPath = path.join(coursesDir, courseId.toString());
        // Ensure folder exists (instructor may upload video right after creating course)
        if (!fs.existsSync(courseVideoPath)) fs.mkdirSync(courseVideoPath, { recursive: true });
        cb(null, courseVideoPath);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const uploadVideo = multer({ storage: videoStorage });

// ─── Routes ───────────────────────────────────────────────────────────────────

// Create a new course (Instructor/Admin)
router.post('/', protect, uploadThumbnail.single('thumbnail'), courseController.createCourse);

// Get all courses (Public)
router.get('/', courseController.getCourses);

// Get instructor's own courses (Instructor)
router.get('/mycourses', protect, courseController.getMyCourses);

// Get single course with videos (Public)
router.get('/:courseId', courseController.getCourseById);

// Update course (Instructor only)
router.put('/:courseId', protect, uploadThumbnail.single('thumbnail'), courseController.updateCourse);

// Delete course (Instructor or Admin)
router.delete('/:courseId', protect, courseController.deleteCourse);

// Enroll user in course (Protected)
router.post('/:courseId/enroll', protect, courseController.enrollCourse);

// Get enrolled students (Instructor)
router.get('/:courseId/students', protect, courseController.getEnrolledStudents);

// Upload video (Instructor)
router.post('/:courseId/videos', protect, uploadVideo.single('video'), courseController.uploadVideo);

// Delete video (Instructor)
router.delete('/:courseId/videos/:videoId', protect, courseController.deleteVideo);

module.exports = router;
