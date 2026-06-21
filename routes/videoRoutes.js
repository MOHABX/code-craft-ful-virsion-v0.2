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
    limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB per video
    fileFilter: (req, file, cb) => {
        const allowed = ['video/mp4', 'video/webm', 'video/ogg', 'video/mkv', 'video/avi', 'video/quicktime'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only video files are allowed!'), false);
        }
    }
});

// Bulk upload multiple videos to a course (Doctor only)
router.post('/upload/:courseId', protect, videoUpload.array('videos', 20), videoController.uploadVideos);

// Mark a video as complete for the logged-in user
router.post('/:videoId/complete', protect, videoController.markVideoComplete);

// Delete a video (instructor only)
router.delete('/:videoId', protect, videoController.deleteVideo);

module.exports = router;
