const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const userController = require('../userController');

// Get courses enrolled by the logged-in user
router.get('/my-courses', protect, userController.getMyCourses);

// Get user's completed videos for a specific course
router.get('/progress/:courseId', protect, userController.getCourseProgress);

// Get public instructor profile with their courses + avg ratings
router.get('/instructor/:id', userController.getInstructorProfile);

// Get logged-in user's dashboard stats
router.get('/dashboard', protect, userController.getDashboardStats);

module.exports = router;
