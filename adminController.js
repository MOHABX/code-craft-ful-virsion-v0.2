const User = require('./User');
const Course = require('./Course');
const Enrollment = require('./Enrollment');
const Review = require('./Review');
const QuizResult = require('./QuizResult');
const { Op, fn, col } = require('sequelize');

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
exports.getStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalStudents = await User.count({ where: { role: 'student' } });
        const totalInstructors = await User.count({ where: { role: 'doctor' } });
        const totalCourses = await Course.count();
        const totalEnrollments = await Enrollment.count();
        const totalReviews = await Review.count();

        const avgRatingResult = await Review.findOne({
            attributes: [[fn('AVG', col('rating')), 'avgRating']],
            raw: true
        });
        const avgRating = parseFloat(avgRatingResult?.avgRating || 0).toFixed(1);

        res.status(200).json({
            success: true,
            data: {
                users: totalUsers,
                students: totalStudents,
                instructors: totalInstructors,
                courses: totalCourses,
                enrollments: totalEnrollments,
                reviews: totalReviews,
                avgRating: parseFloat(avgRating),
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching stats.' });
    }
};

// @desc    Get all users (with pagination and search)
// @route   GET /api/admin/users?page=1&limit=20&search=keyword
// @access  Private/Admin
exports.getUsers = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { name: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const { count, rows: users } = await User.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit)),
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching users.' });
    }
};

// @desc    Update a user by Admin
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // منع الأدمن من تغيير صلاحياته لنفسه
        if (user.id === req.user.id && req.body.role && req.body.role !== 'admin') {
            return res.status(400).json({ message: "Admins cannot change their own role." });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        user.role = req.body.role || user.role;

        if (req.body.isVerified !== undefined) {
            user.isVerified = req.body.isVerified;
        }

        await user.save();
        res.status(200).json({ success: true, data: user, message: 'User updated successfully!' });
    } catch (error) {
        console.error('Error updating user by admin:', error);
        res.status(500).json({ message: 'Server error updating user.' });
    }
};

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
    try {
        // منع الأدمن من حذف نفسه
        if (parseInt(req.params.id) === req.user.id) {
            return res.status(400).json({ message: 'Admins cannot delete their own account from admin panel.' });
        }

        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        await user.destroy();
        res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting user.' });
    }
};

// @desc    Get all courses (with pagination and search)
// @route   GET /api/admin/courses?page=1&limit=20&search=keyword
// @access  Private/Admin
exports.getCourses = async (req, res) => {
    try {
        const { page = 1, limit = 20, search } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};

        if (search) {
            whereClause.title = { [Op.like]: `%${search}%` };
        }

        const { count, rows: courses } = await Course.findAndCountAll({
            where: whereClause,
            include: { model: User, as: 'instructor', attributes: ['name', 'email'] },
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset,
            distinct: true,
        });

        res.status(200).json({
            success: true,
            data: courses,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit)),
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching courses.' });
    }
};

// @desc    Delete a course (with file cleanup)
// @route   DELETE /api/admin/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
    const fs = require('fs');
    const path = require('path');

    try {
        const course = await Course.findByPk(req.params.id);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        // حذف ملفات الفيديو من الـ disk
        const courseVideoPath = path.join(__dirname, '..', 'uploads', 'courses', req.params.id.toString());
        if (fs.existsSync(courseVideoPath)) {
            fs.rmSync(courseVideoPath, { recursive: true, force: true });
        }

        // حذف الـ thumbnail إن وُجد
        if (course.thumbnail) {
            const thumbPath = path.join(__dirname, '..', course.thumbnail);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }

        await course.destroy();
        res.status(200).json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error deleting course.' });
    }
};

// @desc    Get all reviews (with pagination and search)
// @route   GET /api/admin/reviews?page=1&limit=20&search=keyword
// @access  Private/Admin
exports.getReviews = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const { count, rows: reviews } = await Review.findAndCountAll({
            include: [
                { model: User, as: 'reviewer', attributes: ['name', 'email'] },
                { model: Course, attributes: ['title'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        res.status(200).json({
            success: true,
            data: reviews,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit))
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching reviews.' });
    }
};