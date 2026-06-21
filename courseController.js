const fs = require('fs');
const path = require('path');
const { Op, fn, col } = require('sequelize');
const Course = require('./Course');
const Video = require('./Video');
const User = require('./User');
const Enrollment = require('./Enrollment');
const Review = require('./Review');

const uploadsDir = path.join(__dirname, '..', 'uploads');
const coursesDir = path.join(uploadsDir, 'courses');

exports.createCourse = async (req, res) => {
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only instructors can create courses.' });
    }

    const { title, description, category, level } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Course title is required.' });
    }

    try {
        const courseData = {
            title,
            description,
            category: category || 'Other',
            level: level || 'Beginner',
            instructorId: req.user.id,
        };
        if (req.file) {
            courseData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
        }

        const course = await Course.create(courseData);

        // Create a dedicated folder for the course videos
        const courseVideoPath = path.join(coursesDir, course.id.toString());
        if (!fs.existsSync(courseVideoPath)) {
            fs.mkdirSync(courseVideoPath, { recursive: true });
        }

        res.status(201).json({ success: true, data: course });
    } catch (error) {
        console.error('Course creation error:', error);
        res.status(500).json({ message: 'Server error while creating course.' });
    }
};

exports.getCourses = async (req, res) => {
    try {
        const { search, category, level, page = 1, limit = 12 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ];
        }
        if (category) whereClause.category = category;
        if (level) whereClause.level = level;

        const { count, rows: courses } = await Course.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, as: 'instructor', attributes: ['id', 'name', 'profilePic'] },
                { model: Video, as: 'videos', attributes: ['id'] },
            ],
            distinct: true,
            limit: parseInt(limit),
            offset,
        });

        const courseIds = courses.map(c => c.id);
        let ratingMap = {};
        if (courseIds.length > 0) {
            const ratings = await Review.findAll({
                where: { courseId: { [Op.in]: courseIds } },
                attributes: [
                    'courseId',
                    [fn('AVG', col('rating')), 'avgRating'],
                    [fn('COUNT', col('id')), 'reviewCount'],
                ],
                group: ['courseId'],
                raw: true
            });
            ratings.forEach(r => {
                ratingMap[r.courseId] = {
                    avgRating: parseFloat(r.avgRating || 0).toFixed(1),
                    reviewCount: parseInt(r.reviewCount || 0)
                };
            });
        }

        const coursesWithRating = courses.map(c => ({
            ...c.toJSON(),
            avgRating: parseFloat(ratingMap[c.id]?.avgRating || 0),
            reviewCount: ratingMap[c.id]?.reviewCount || 0
        }));

        res.status(200).json({
            success: true,
            data: coursesWithRating,
            pagination: {
                total: count,
                page: parseInt(page),
                pages: Math.ceil(count / parseInt(limit)),
            }
        });
    } catch (error) {
        console.error("Error fetching public courses:", error);
        res.status(500).json({ message: 'Server error fetching courses.' });
    }
};

exports.getMyCourses = async (req, res) => {
    try {
        const courses = await Course.findAll({
            where: { instructorId: req.user.id },
            include: [{ model: Video, as: 'videos', attributes: ['id', 'title'] }]
        });
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching instructor courses.' });
    }
};

exports.getCourseById = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.courseId, {
            include: [
                { model: User, as: 'instructor', attributes: ['name', 'profilePic'] },
                { model: Video, as: 'videos', attributes: ['id', 'title', 'path'], order: [['createdAt', 'ASC']] }
            ]
        });

        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        res.status(200).json({ success: true, data: course });
    } catch (error) {
        console.error("Error fetching single course:", error);
        res.status(500).json({ message: 'Server error fetching course details.' });
    }
};

exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        if (course.instructorId !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to update this course.' });
        }

        const { title, description, category, level } = req.body;
        if (title) course.title = title;
        if (description !== undefined) course.description = description;
        if (category) course.category = category;
        if (level) course.level = level;
        if (req.file) {
            if (course.thumbnail) {
                const oldThumbPath = path.join(__dirname, '..', course.thumbnail);
                if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
            }
            course.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
        }

        await course.save();
        res.status(200).json({ success: true, data: course, message: 'Course updated successfully.' });
    } catch (error) {
        console.error('Course update error:', error);
        res.status(500).json({ message: 'Server error updating course.' });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this course.' });
        }

        const courseVideoPath = path.join(coursesDir, req.params.courseId.toString());
        if (fs.existsSync(courseVideoPath)) {
            fs.rmSync(courseVideoPath, { recursive: true, force: true });
        }

        if (course.thumbnail) {
            const thumbPath = path.join(__dirname, '..', course.thumbnail);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }

        await course.destroy();
        res.status(200).json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Course delete error:', error);
        res.status(500).json({ message: 'Server error deleting course.' });
    }
};

exports.enrollCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.id;

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        const existingEnrollment = await Enrollment.findOne({ where: { userId, courseId } });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'You are already enrolled in this course.' });
        }

        await Enrollment.create({ userId, courseId });
        res.status(201).json({ success: true, message: 'Successfully enrolled in the course!' });
    } catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).json({ message: 'Server error during enrollment.' });
    }
};

exports.getEnrolledStudents = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.id;

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        if (course.instructorId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to view students for this course.' });
        }

        const enrolledStudents = await course.getEnrolledStudents({
            attributes: ['id', 'name', 'email', 'profilePic'],
            joinTableAttributes: ['createdAt']
        });

        res.status(200).json({ success: true, data: enrolledStudents });
    } catch (error) {
        console.error("Error fetching enrolled students:", error);
        res.status(500).json({ message: 'Server error while fetching students.' });
    }
};

exports.uploadVideo = async (req, res) => {
    const { courseId } = req.params;
    const { title } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded.' });
    }

    try {
        const course = await Course.findByPk(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found.' });
        if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only the course instructor or admin can upload videos.' });
        }

        const video = await Video.create({
            title: title || req.file.originalname,
            path: `/uploads/courses/${courseId}/${req.file.filename}`,
            courseId: courseId,
        });
        res.status(201).json({ success: true, message: 'Video uploaded successfully!', data: video });
    } catch (error) {
        console.error("Video upload error:", error);
        res.status(500).json({ message: 'Server error while saving video info.' });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const { courseId, videoId } = req.params;

        const course = await Course.findByPk(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found.' });
        if (course.instructorId !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to delete videos from this course.' });
        }

        const video = await Video.findOne({ where: { id: videoId, courseId } });
        if (!video) return res.status(404).json({ message: 'Video not found in this course.' });

        const filePath = path.join(__dirname, '..', video.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await video.destroy();
        res.status(200).json({ success: true, message: 'Video deleted successfully.' });
    } catch (error) {
        console.error('Video delete error:', error);
        res.status(500).json({ message: 'Server error deleting video.' });
    }
};
