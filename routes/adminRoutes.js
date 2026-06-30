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

// جميع المسارات في هذا الملف محمية وخاصة بالمسؤولين فقط
router.use(protect, admin);

// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.get('/stats', getStats);

// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.get('/users', getUsers);
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.put('/users/:id', updateUser);
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.delete('/users/:id', deleteUser);

// انتحال شخصية مستخدم
const User = require('../User');
const jwt = require('jsonwebtoken');
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.get('/users/:id/impersonate', async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.cookie('accessToken', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 1 * 60 * 60 * 1000 // ساعة واحدة لانتحال الشخصية
        });

        res.status(200).json({ success: true, token, role: user.role, userId: user.id });
    } catch (error) {
        res.status(500).json({ message: 'Server error during impersonation' });
    }
});

// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.get('/courses', getCourses);
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
router.delete('/courses/:id', deleteCourse);

// إدارة المراجعات للمسؤولين
// هني نستقبل تقييم الرجال، عساه يعطينا خمس نجوم وما يكسر بخاطرنا
router.get('/reviews', getReviews);
// هني نستقبل تقييم الرجال، عساه يعطينا خمس نجوم وما يكسر بخاطرنا
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