const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const reviewController = require('../reviewController');

// Add or update a review for a course (only enrolled students)
router.post('/:courseId', protect, reviewController.addOrUpdateReview);

// Get all reviews for a course (with average rating)
router.get('/:courseId', reviewController.getReviewsForCourse);

// Get the logged-in user's review for a specific course
router.get('/:courseId/mine', protect, reviewController.getMyReview);

// Delete a review
router.delete('/:courseId', protect, reviewController.deleteMyReview);

// Admin: Delete any review
router.delete('/admin/:reviewId', protect, reviewController.deleteReviewAdmin);

module.exports = router;
