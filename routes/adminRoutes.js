const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { admin } = require('../middlewares/adminMiddleware');
const {
    getStats,
    getUsers,
    updateUser,
    deleteUser,
    getCourses,
    deleteCourse,
    getReviews,
} = require('../adminController');
const Review = require('../Review');

// All routes in this file are protected and for admins only
router.use(protect, admin);

router.get('/stats', getStats);

router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

// Impersonate User
const User = require('../User');
const jwt = require('jsonwebtoken');
router.get('/users/:id/impersonate', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1 * 60 * 60 * 1000 // 1 hour for impersonation
        });

        res.status(200).json({ success: true, token, role: user.role, userId: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error during impersonation' });
    }
});

router.get('/courses', getCourses);
router.delete('/courses/:id', deleteCourse);

// Admin Reviews Management
router.get('/reviews', getReviews);
router.delete('/reviews/:id', async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        await review.destroy();
        res.status(200).json({ success: true, message: 'Review deleted by admin.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting review.' });
    }
});

module.exports = router;