const fs = require('fs');
const path = require('path');
const { Op, fn, col } = require('sequelize'); // مكتبات التعامل مع العمليات المعقدة في قاعدة البيانات
const Course = require('./Course'); // نموذج الكورسات
const Video = require('./Video'); // نموذج الفيديوهات
const User = require('./User'); // نموذج المستخدمين
const Enrollment = require('./Enrollment'); // نموذج الاشتراكات (التحاق الطلاب)
const Review = require('./Review'); // نموذج التقييمات

// ─── تحديد مسارات مجلدات رفع الملفات ───
const uploadsDir = path.join(__dirname, '..', 'uploads');
const coursesDir = path.join(uploadsDir, 'courses'); // مجلد الفيديوهات الخاصة بالكورسات

// ─── 1. دالة إنشاء كورس جديد (Create Course) ───
exports.createCourse = async (req, res) => {
    // التأكد من أن المستخدم بصلاحية "دكتور/محاضر" أو "أدمن" فقط
    if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only instructors can create courses.' });
    }

    const { title, description, category, level } = req.body;
    if (!title) {
        return res.status(400).json({ message: 'Course title is required.' });
    }

    try {
        // تجهيز بيانات الكورس للحفظ في قاعدة البيانات
        const courseData = {
            title,
            description,
            category: category || 'Other',
            level: level || 'Beginner',
            instructorId: req.user.id, // ربط الكورس بمعرف المحاضر الحالي
        };
        
        // إذا تم رفع صورة مصغرة (Thumbnail) للكورس، أضف مسارها
        if (req.file) {
            courseData.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
        }

        // حفظ الكورس في قاعدة البيانات
        const course = await Course.create(courseData);

        // إنشاء مجلد مخصص داخل 'uploads/courses' يحمل رقم الـ ID الخاص بالكورس لتخزين فيديوهاته لاحقاً
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

// ─── 2. دالة جلب جميع الكورسات مع البحث والفلترة (Get Courses) ───
exports.getCourses = async (req, res) => {
    try {
        // استقبال معايير البحث والفلترة والصفحات من الرابط
        const { search, category, level, page = 1, limit = 12 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit); // حساب من أين يبدأ الجلب بناءً على رقم الصفحة
        const whereClause = {};

        // إذا كان هناك نص بحث، ابحث في العنوان أو الوصف
        if (search) {
            whereClause[Op.or] = [
                { title: { [Op.like]: `%${search}%` } },
                { description: { [Op.like]: `%${search}%` } },
            ];
        }
        if (category) whereClause.category = category; // فلترة بالقسم
        if (level) whereClause.level = level; // فلترة بالمستوى

        // جلب الكورسات من قاعدة البيانات مع بيانات المحاضر وعدد الفيديوهات
        const { count, rows: courses } = await Course.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, as: 'instructor', attributes: ['id', 'name', 'profilePic'] },
                { model: Video, as: 'videos', attributes: ['id'] },
            ],
            distinct: true, // لتجنب تكرار العد في حالة وجود علاقات متعددة
            limit: parseInt(limit),
            offset,
        });

        // ─── حساب متوسط التقييمات لكل كورس تم جلبه ───
        const courseIds = courses.map(c => c.id);
        let ratingMap = {};
        if (courseIds.length > 0) {
            const ratings = await Review.findAll({
                where: { courseId: { [Op.in]: courseIds } },
                attributes: [
                    'courseId',
                    [fn('AVG', col('rating')), 'avgRating'], // متوسط التقييمات
                    [fn('COUNT', col('id')), 'reviewCount'], // عدد التقييمات
                ],
                group: ['courseId'],
                raw: true
            });
            // تحويل النتائج إلى خريطة (Map) ليسهل دمجها مع الكورسات
            ratings.forEach(r => {
                ratingMap[r.courseId] = {
                    avgRating: parseFloat(r.avgRating || 0).toFixed(1),
                    reviewCount: parseInt(r.reviewCount || 0)
                };
            });
        }

        // دمج بيانات التقييم مع بيانات الكورس
        const coursesWithRating = courses.map(c => ({
            ...c.toJSON(),
            avgRating: parseFloat(ratingMap[c.id]?.avgRating || 0),
            reviewCount: ratingMap[c.id]?.reviewCount || 0
        }));

        res.status(200).json({
            success: true,
            data: coursesWithRating,
            pagination: {
                total: count, // العدد الكلي للكورسات
                page: parseInt(page), // الصفحة الحالية
                pages: Math.ceil(count / parseInt(limit)), // عدد الصفحات الكلي
            }
        });
    } catch (error) {
        console.error("Error fetching public courses:", error);
        res.status(500).json({ message: 'Server error fetching courses.' });
    }
};

// ─── 3. دالة جلب الكورسات الخاصة بالمحاضر (Get My Courses) ───
exports.getMyCourses = async (req, res) => {
    try {
        // جلب جميع الكورسات التي قام بإنشائها المحاضر المسجل الدخول حالياً
        const courses = await Course.findAll({
            where: { instructorId: req.user.id },
            include: [{ model: Video, as: 'videos', attributes: ['id', 'title'] }]
        });
        res.status(200).json({ success: true, data: courses });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching instructor courses.' });
    }
};

// ─── 4. دالة جلب تفاصيل كورس معين بالـ ID ───
exports.getCourseById = async (req, res) => {
    try {
        // جلب الكورس مع بيانات المحاضر وكل الفيديوهات التابعة له، مرتبة حسب الأقدمية
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

// ─── 5. دالة تحديث بيانات الكورس ───
exports.updateCourse = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        // التأكد من أن المستخدم الحالي هو صاحب الكورس نفسه
        if (course.instructorId !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to update this course.' });
        }

        const { title, description, category, level } = req.body;
        if (title) course.title = title;
        if (description !== undefined) course.description = description;
        if (category) course.category = category;
        if (level) course.level = level;
        
        // إذا قام المستخدم برفع صورة مصغرة جديدة، يتم حذف القديمة من الخادم وتحديث المسار
        if (req.file) {
            if (course.thumbnail) {
                const oldThumbPath = path.join(__dirname, '..', course.thumbnail);
                if (fs.existsSync(oldThumbPath)) fs.unlinkSync(oldThumbPath);
            }
            course.thumbnail = `/uploads/thumbnails/${req.file.filename}`;
        }

        await course.save(); // حفظ التعديلات
        res.status(200).json({ success: true, data: course, message: 'Course updated successfully.' });
    } catch (error) {
        console.error('Course update error:', error);
        res.status(500).json({ message: 'Server error updating course.' });
    }
};

// ─── 6. دالة حذف الكورس نهائياً ───
exports.deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByPk(req.params.courseId);

        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        // السماح بالحذف فقط لصاحب الكورس أو للأدمن
        if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized to delete this course.' });
        }

        // حذف المجلد الذي يحتوي على فيديوهات الكورس بالكامل
        const courseVideoPath = path.join(coursesDir, req.params.courseId.toString());
        if (fs.existsSync(courseVideoPath)) {
            fs.rmSync(courseVideoPath, { recursive: true, force: true });
        }

        // حذف الصورة المصغرة الخاصة بالكورس
        if (course.thumbnail) {
            const thumbPath = path.join(__dirname, '..', course.thumbnail);
            if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }

        await course.destroy(); // حذف السجل من قاعدة البيانات
        res.status(200).json({ success: true, message: 'Course deleted successfully.' });
    } catch (error) {
        console.error('Course delete error:', error);
        res.status(500).json({ message: 'Server error deleting course.' });
    }
};

// ─── 7. دالة اشتراك الطالب في الكورس (Enroll) ───
exports.enrollCourse = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.id; // معرف الطالب المسجل دخول

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }

        // التحقق مما إذا كان الطالب مشتركاً مسبقاً لمنع التكرار
        const existingEnrollment = await Enrollment.findOne({ where: { userId, courseId } });
        if (existingEnrollment) {
            return res.status(400).json({ message: 'You are already enrolled in this course.' });
        }

        // إنشاء سجل اشتراك جديد في جدول Enrollments
        await Enrollment.create({ userId, courseId });
        res.status(201).json({ success: true, message: 'Successfully enrolled in the course!' });
    } catch (error) {
        console.error("Enrollment error:", error);
        res.status(500).json({ message: 'Server error during enrollment.' });
    }
};

// ─── 8. دالة جلب الطلاب المشتركين في الكورس (للمحاضر) ───
exports.getEnrolledStudents = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.id;

        const course = await Course.findByPk(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found.' });
        }
        // التحقق من أن المحاضر الذي يطلب البيانات هو نفسه من أنشأ الكورس
        if (course.instructorId !== userId) {
            return res.status(403).json({ message: 'You are not authorized to view students for this course.' });
        }

        // جلب أسماء الطلاب المشتركين باستخدام العلاقة المعرفة مسبقاً
        const enrolledStudents = await course.getEnrolledStudents({
            attributes: ['id', 'name', 'email', 'profilePic'],
            joinTableAttributes: ['createdAt'] // جلب تاريخ الاشتراك من جدول الربط
        });

        res.status(200).json({ success: true, data: enrolledStudents });
    } catch (error) {
        console.error("Error fetching enrolled students:", error);
        res.status(500).json({ message: 'Server error while fetching students.' });
    }
};

// ─── 9. دالة رفع فيديو جديد للكورس ───
exports.uploadVideo = async (req, res) => {
    const { courseId } = req.params;
    const { title } = req.body;

    if (!req.file) {
        return res.status(400).json({ message: 'No video file uploaded.' });
    }

    try {
        const course = await Course.findByPk(courseId);
        if (!course) return res.status(404).json({ message: 'Course not found.' });
        
        // التحقق من الصلاحيات (محاضر الكورس أو أدمن)
        if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only the course instructor or admin can upload videos.' });
        }

        // إنشاء سجل الفيديو في قاعدة البيانات بالمسار الذي تم رفعه
        const video = await Video.create({
            title: title || req.file.originalname, // إذا لم يرسل عنوان، استخدم اسم الملف
            path: `/uploads/courses/${courseId}/${req.file.filename}`,
            courseId: courseId,
        });
        res.status(201).json({ success: true, message: 'Video uploaded successfully!', data: video });
    } catch (error) {
        console.error("Video upload error:", error);
        res.status(500).json({ message: 'Server error while saving video info.' });
    }
};

// ─── 10. دالة حذف فيديو ───
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

        // حذف ملف الفيديو الفعلي من الخادم
        const filePath = path.join(__dirname, '..', video.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        // حذف سجل الفيديو من قاعدة البيانات
        await video.destroy();
        res.status(200).json({ success: true, message: 'Video deleted successfully.' });
    } catch (error) {
        console.error('Video delete error:', error);
        res.status(500).json({ message: 'Server error deleting video.' });
    }
};
