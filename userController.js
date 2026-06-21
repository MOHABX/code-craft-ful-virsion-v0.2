const User = require('./User');
const Course = require('./Course');
const Video = require('./Video');
const Enrollment = require('./Enrollment');
const UserVideoProgress = require('./UserVideoProgress');
const Certificate = require('./Certificate');
const QuizResult = require('./QuizResult');
const { fn, literal } = require('sequelize');

exports.getMyCourses = async (req, res) => {
    try {
        const userWithCourses = await User.findByPk(req.user.id, {
            include: {
                model: Course,
                as: 'enrolledCourses',
                include: [
                    { model: Video, as: 'videos', attributes: ['id'] }
                ],
                through: { attributes: [] } 
            }
        });

        if (!userWithCourses) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userWithProgress = await User.findByPk(req.user.id, {
            include: {
                model: Video,
                as: 'completedVideos',
                attributes: ['id']
            }
        });
        const completedVideoIds = new Set((userWithProgress.completedVideos || []).map(v => v.id));

        const coursesWithProgress = (userWithCourses.enrolledCourses || []).map(course => {
            const totalVideos = course.videos ? course.videos.length : 0;
            const progress = totalVideos === 0 ? 0 : Math.round(
                (course.videos.filter(v => completedVideoIds.has(v.id)).length / totalVideos) * 100
            );
            const { videos, ...courseData } = course.toJSON();
            return { ...courseData, progress };
        });

        res.status(200).json({ success: true, data: coursesWithProgress });
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ message: 'Server error while fetching enrolled courses.' });
    }
};

exports.getCourseProgress = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.id;

        const courseVideos = await Video.findAll({ where: { courseId }, attributes: ['id'] });
        const courseVideoIds = courseVideos.map(v => v.id);

        const userWithCompletedVideos = await User.findByPk(userId, {
            include: { model: Video, as: 'completedVideos', where: { id: courseVideoIds }, attributes: ['id'], required: false }
        });

        const completedVideoIds = userWithCompletedVideos && userWithCompletedVideos.completedVideos ? userWithCompletedVideos.completedVideos.map(v => v.id) : [];

        res.status(200).json({ success: true, data: completedVideoIds });
    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ message: 'Server error while fetching progress.' });
    }
};

exports.getInstructorProfile = async (req, res) => {
    try {
        const instructor = await User.findOne({
            where: { id: req.params.id, role: 'doctor' },
            attributes: ['id', 'name', 'profilePic', 'bio', 'createdAt'],
            include: [{
                model: Course,
                as: 'courses',
                include: [{ model: Video, as: 'videos', attributes: ['id'] }]
            }]
        });

        if (!instructor) return res.status(404).json({ message: 'Instructor not found.' });

        res.status(200).json({ success: true, data: instructor });
    } catch (error) {
        console.error('Error fetching instructor profile:', error);
        res.status(500).json({ message: 'Server error.' });
    }
};

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        if (req.user.role === 'doctor') {
            const totalCourses = await Course.count({ where: { instructorId: userId } });
            
            const courses = await Course.findAll({ where: { instructorId: userId }, attributes: ['id'] });
            const courseIds = courses.map(c => c.id);
            
            const totalStudents = await Enrollment.count({ where: { courseId: courseIds } });
            const totalVideos = await Video.count({ where: { courseId: courseIds } });

            return res.status(200).json({
                success: true,
                data: {
                    totalCourses,
                    totalStudents,
                    totalVideos
                }
            });
        }

        const enrolledCount = await Enrollment.count({ where: { userId } });
        const completedVideosCount = await UserVideoProgress.count({ where: { userId } });
        const certificatesCount = await Certificate.count({ where: { userId } });

        const quizResults = await QuizResult.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        const totalQuizzes = await QuizResult.count({ where: { userId } });
        const avgScore = await QuizResult.findOne({
            where: { userId },
            attributes: [
                [fn('AVG', literal('score / total * 100')), 'avgPercent']
            ],
            raw: true
        });

        res.status(200).json({
            success: true,
            data: {
                enrolledCourses: enrolledCount,
                completedVideos: completedVideosCount,
                certificates: certificatesCount,
                totalQuizzes,
                avgQuizScore: parseFloat(avgScore?.avgPercent || 0).toFixed(1),
                recentQuizResults: quizResults,
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard.' });
    }
};
