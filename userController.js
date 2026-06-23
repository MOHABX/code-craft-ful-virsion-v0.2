const User = require('./User'); // نموذج المستخدمين
const Course = require('./Course'); // نموذج الكورسات
const Video = require('./Video'); // نموذج الفيديوهات
const Enrollment = require('./Enrollment'); // نموذج الاشتراكات في الكورسات
const UserVideoProgress = require('./UserVideoProgress'); // نموذج تتبع تقدم مشاهدة الفيديوهات
const Certificate = require('./Certificate'); // نموذج الشهادات
const QuizResult = require('./QuizResult'); // نموذج نتائج الاختبارات
const { fn, literal } = require('sequelize'); // أدوات للتعامل مع العمليات الحسابية داخل قاعدة البيانات

// ─── 1. دالة جلب الكورسات المشترك بها الطالب مع نسبة الإنجاز ───
exports.getMyCourses = async (req, res) => {
    try {
        // جلب المستخدم مع الكورسات المشترك بها، بالإضافة للفيديوهات الموجودة داخل كل كورس
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

        // جلب معرفات جميع الفيديوهات التي أكملها الطالب
        const userWithProgress = await User.findByPk(req.user.id, {
            include: {
                model: Video,
                as: 'completedVideos',
                attributes: ['id']
            }
        });
        // تحويل المعرفات إلى مجموعة (Set) لسهولة وسرعة البحث
        const completedVideoIds = new Set((userWithProgress.completedVideos || []).map(v => v.id));

        // حساب نسبة الإنجاز (Progress) لكل كورس بناءً على الفيديوهات المكتملة
        const coursesWithProgress = (userWithCourses.enrolledCourses || []).map(course => {
            const totalVideos = course.videos ? course.videos.length : 0;
            // إذا لم يكن هناك فيديوهات، النسبة 0، وإلا احسب نسبة الفيديوهات المكتملة
            const progress = totalVideos === 0 ? 0 : Math.round(
                (course.videos.filter(v => completedVideoIds.has(v.id)).length / totalVideos) * 100
            );
            // إخفاء تفاصيل الفيديوهات من النتيجة المُرسلة لتخفيف حجم البيانات
            const { videos, ...courseData } = course.toJSON();
            return { ...courseData, progress };
        });

        res.status(200).json({ success: true, data: coursesWithProgress });
    } catch (error) {
        console.error('Error fetching enrolled courses:', error);
        res.status(500).json({ message: 'Server error while fetching enrolled courses.' });
    }
};

// ─── 2. دالة جلب قائمة الفيديوهات المكتملة لكورس معين ───
exports.getCourseProgress = async (req, res) => {
    try {
        const courseId = req.params.courseId;
        const userId = req.user.id;

        // جلب جميع الفيديوهات التابعة لهذا الكورس
        const courseVideos = await Video.findAll({ where: { courseId }, attributes: ['id'] });
        const courseVideoIds = courseVideos.map(v => v.id);

        // جلب الفيديوهات التي أكملها المستخدم ولكن بشرط أن تكون من ضمن فيديوهات هذا الكورس فقط
        const userWithCompletedVideos = await User.findByPk(userId, {
            include: { model: Video, as: 'completedVideos', where: { id: courseVideoIds }, attributes: ['id'], required: false }
        });

        const completedVideoIds = userWithCompletedVideos && userWithCompletedVideos.completedVideos ? userWithCompletedVideos.completedVideos.map(v => v.id) : [];

        // إرجاع قائمة بأرقام الفيديوهات المكتملة
        res.status(200).json({ success: true, data: completedVideoIds });
    } catch (error) {
        console.error('Error fetching course progress:', error);
        res.status(500).json({ message: 'Server error while fetching progress.' });
    }
};

// ─── 3. دالة جلب الملف الشخصي للمحاضر ───
exports.getInstructorProfile = async (req, res) => {
    try {
        // البحث عن المستخدم بشرط أن يكون دوره "محاضر" (doctor)
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

// ─── 4. دالة جلب إحصائيات لوحة التحكم (للطالب والمحاضر) ───
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // --- إحصائيات خاصة بالمحاضر ---
        if (req.user.role === 'doctor') {
            const totalCourses = await Course.count({ where: { instructorId: userId } });
            
            // جلب أرقام الكورسات التابعة للمحاضر لحساب عدد الطلاب المشتركين فيها
            const courses = await Course.findAll({ where: { instructorId: userId }, attributes: ['id'] });
            const courseIds = courses.map(c => c.id);
            
            const totalStudents = await Enrollment.count({ where: { courseId: courseIds } });
            const totalVideos = await Video.count({ where: { courseId: courseIds } });

            return res.status(200).json({
                success: true,
                data: {
                    totalCourses, // عدد الكورسات
                    totalStudents, // عدد الطلاب
                    totalVideos // إجمالي الفيديوهات المرفوعة
                }
            });
        }

        // --- إحصائيات خاصة بالطالب ---
        const enrolledCount = await Enrollment.count({ where: { userId } }); // الكورسات المشترك بها
        const completedVideosCount = await UserVideoProgress.count({ where: { userId } }); // الفيديوهات المُكتملة
        const certificatesCount = await Certificate.count({ where: { userId } }); // الشهادات الحاصل عليها

        // جلب آخر 5 نتائج اختبارات أداها الطالب
        const quizResults = await QuizResult.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        const totalQuizzes = await QuizResult.count({ where: { userId } }); // إجمالي الاختبارات
        
        // حساب متوسط الدرجات (النسبة المئوية) في جميع الاختبارات
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
                avgQuizScore: parseFloat(avgScore?.avgPercent || 0).toFixed(1), // متوسط الدرجة كنسبة
                recentQuizResults: quizResults, // النتائج الأخيرة
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard.' });
    }
};
