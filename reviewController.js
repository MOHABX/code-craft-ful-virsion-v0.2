const Review = require('./Review');
const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const { Op, fn, col } = require('sequelize');

exports.addOrUpdateReview = async (req, res) => {
    const { rating, comment } = req.body;
    const userId = req.user.id;
    const courseId = req.params.courseId;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
    }

    try {
        const course = await Course.findByPk(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found.' });

        const enrollment = await Enrollment.findOne({ where: { userId, courseId } });
        if (!enrollment) {
            return res.status(403).json({ message: 'You must be enrolled in this course to review it.' });
        }

        if (course.instructorId === userId) {
            return res.status(403).json({ message: 'Instructors cannot review their own courses.' });
        }

        const [review, created] = await Review.findOrCreate({
            where: { userId, courseId },
            defaults: { rating, comment: comment || null }
        });

        if (!created) {
            review.rating = rating;
            review.comment = comment || review.comment;
            await review.save();
        }

        res.status(created ? 201 : 200).json({
            success: true,
            message: created ? 'Review submitted successfully!' : 'Review updated successfully!',
            data: review
        });
    } catch (error) {
        console.error('Review error:', error);
        res.status(500).json({ message: 'Server error submitting review.' });
    }
};

exports.getReviewsForCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const { page = 1, limit = 10 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: reviews } = await Review.findAndCountAll({
            where: { courseId },
            include: [{ model: User, as: 'reviewer', attributes: ['id', 'name', 'profilePic'] }],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        const avgResult = await Review.findOne({
            where: { courseId },
            attributes: [
                [fn('AVG', col('rating')), 'avgRating'],
                [fn('COUNT', col('id')), 'totalReviews']
            ],
            raw: true
        });

        const avgRating = avgResult ? parseFloat(avgResult.avgRating || 0).toFixed(1) : '0.0';
        const totalReviews = parseInt(avgResult?.totalReviews || 0);

        res.status(200).json({
            success: true,
            avgRating: parseFloat(avgRating),
            totalReviews,
            data: reviews,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ message: 'Server error fetching reviews.' });
    }
};

exports.getMyReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            where: { courseId: req.params.courseId, userId: req.user.id }
        });
        res.status(200).json({ success: true, data: review || null });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.deleteMyReview = async (req, res) => {
    try {
        const review = await Review.findOne({
            where: { courseId: req.params.courseId, userId: req.user.id }
        });
        if (!review) return res.status(404).json({ message: 'Review not found.' });

        await review.destroy();
        res.status(200).json({ success: true, message: 'Review deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.deleteReviewAdmin = async (req, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized.' });
    try {
        const review = await Review.findByPk(req.params.reviewId);
        if (!review) return res.status(404).json({ message: 'Review not found.' });
        await review.destroy();
        res.status(200).json({ success: true, message: 'Review deleted by admin.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};
