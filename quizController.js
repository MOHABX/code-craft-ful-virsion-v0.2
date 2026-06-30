const { GoogleGenerativeAI } = require("@google/generative-ai"); // مكتبة جوجل للذكاء الاصطناعي (Gemini) لتوليد الأسئلة
const QuizResult = require('./QuizResult'); // نموذج نتائج الاختبارات
const Enrollment = require('./Enrollment'); // نموذج الاشتراكات
const Course = require('./Course'); // نموذج الكورسات
const Certificate = require('./Certificate'); // نموذج الشهادات
const UserVideoProgress = require('./UserVideoProgress'); // نموذج تقدم المشاهدة (لحذفه في حال الرسوب)
const Video = require('./Video'); // نموذج الفيديوهات

// ─── 1. دالة توليد أسئلة الاختبار باستخدام الذكاء الاصطناعي ───
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
exports.generateQuiz = async (req, res) => {
    const track = req.query.track || 'Web Development'; // المسار المطلوب توليد الأسئلة له
    const courseId = req.query.courseId; // معرف الكورس في حال كان الاختبار مرتبطاً بكورس محدد

    try {
        // التحقق من حالة الاشتراك ومحاولات الاختبار إذا كان الاختبار لكورس معين
        if (courseId) {
            const enrollment = await Enrollment.findOne({ where: { userId: req.user.id, courseId: courseId } });
            if (!enrollment) {
                return res.status(403).json({ error: "You are not enrolled in this course." });
            }
            // إذا تجاوز الطالب 3 محاولات، يمنع من الاختبار ويُطلب منه إعادة مشاهدة الدورة
            if (enrollment.quizAttempts >= 3) {
                return res.status(403).json({ error: "You have exceeded the maximum number of attempts. You must restart the course.", maxAttemptsReached: true });
            }
        }

        // التأكد من توفر مفتاح الـ API الخاص بـ Gemini
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API Key for Gemini is missing in .env" });
        }

        // تهيئة اتصال Gemini AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" }); // استخدام الموديل السريع

        // تصميم الموجه (Prompt) ليجبر الذكاء الاصطناعي على إرجاع 30 سؤال بصيغة JSON صارمة
        const prompt = `You are a tech expert. Generate exactly 30 multiple-choice questions in the field of ${track} in English.
        The response must be in JSON format only, an array of objects exactly like this, with no additional text:
        [{"question": "Question?", "options": ["A", "B", "C", "D"], "correct": 0}]`;

        // إرسال الطلب للذكاء الاصطناعي
        const result = await model.generateContent(prompt);
        
        // تنظيف النص المُسترجع من أي كلمات أو رموز (مثل ```json) قبل تحويله لـ JSON
        let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        const questionsData = JSON.parse(responseText);

        res.json({ questions: questionsData }); // إرسال الأسئلة للواجهة الأمامية
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "Failed to generate questions from AI" });
    }
};

// ─── 2. دالة تسليم إجابات الاختبار وحساب النتيجة ───
// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
exports.submitQuiz = async (req, res) => {
    const { track, score, total, courseId } = req.body;

    // التحقق من صحة البيانات المرسلة من الواجهة الأمامية
    if (!track || score === undefined || !total) {
        return res.status(400).json({ message: 'track, score, and total are required.' });
    }
    if (typeof score !== 'number' || typeof total !== 'number') {
        return res.status(400).json({ message: 'score and total must be numbers.' });
    }
    if (score < 0 || score > total) {
        return res.status(400).json({ message: 'Invalid score value.' });
    }

    try {
        // حفظ النتيجة في قاعدة البيانات كـ سجل تاريخي
        const result = await QuizResult.create({
            userId: req.user.id,
            track,
            score,
            total,
            courseId: courseId || null
        });

        // ─── التعامل مع اختبارات الكورسات (النجاح والرسوب) ───
        if (courseId) {
            const enrollment = await Enrollment.findOne({ where: { userId: req.user.id, courseId: courseId } });
            if (enrollment) {
                // درجة النجاح هي 90%
                const passScore = Math.ceil(total * 0.9);
                
                // في حالة النجاح
                if (score >= passScore) {
                    enrollment.status = 'completed'; // تحويل حالة الكورس إلى مكتمل
                    enrollment.quizAttempts = 0;
                    await enrollment.save();

                    const course = await Course.findByPk(courseId);
                    
                    // إصدار شهادة إتمام للمستخدم وحفظها
                    const cert = await Certificate.create({
                        userId: req.user.id,
                        courseId: courseId,
                        courseName: course ? course.title : track,
                        startDate: enrollment.createdAt,
                        issueDate: new Date()
                    });

                    return res.status(201).json({
                        success: true,
                        passed: true,
                        message: `Quiz submitted! You passed with ${score}/${total}. Certificate generated!`,
                        data: result,
                        certificateId: cert.id // إرسال رقم الشهادة ليتمكن المستخدم من عرضها مباشرة
                    });
                } else {
                    // في حالة الرسوب
                    enrollment.quizAttempts += 1; // زيادة عدد المحاولات الفاشلة
                    await enrollment.save();

                    // إذا وصل لـ 3 محاولات فاشلة
                    if (enrollment.quizAttempts >= 3) {
                        const courseVideos = await Video.findAll({ where: { courseId: courseId } });
                        const videoIds = courseVideos.map(v => v.id);
                        
                        // محو سجل مشاهدات الفيديوهات (Progress) لإجباره على إعادة المشاهدة
                        if (videoIds.length > 0) {
                            await UserVideoProgress.destroy({ where: { userId: req.user.id, videoId: videoIds } });
                        }
                        
                        // تصفير المحاولات وإرجاع حالة الكورس لقيد التنفيذ
                        enrollment.quizAttempts = 0;
                        enrollment.status = 'in-progress';
                        await enrollment.save();

                        return res.status(201).json({
                            success: true,
                            passed: false,
                            maxAttemptsReached: true,
                            message: `Quiz submitted. You scored ${score}/${total}. You failed 3 times. Your course progress has been reset.`,
                            data: result
                        });
                    }

                    // في حال لم يصل للحد الأقصى، السماح بمحاولات إضافية
                    return res.status(201).json({
                        success: true,
                        passed: false,
                        message: `Quiz submitted. You scored ${score}/${total}. You failed. Attempts left: ${3 - enrollment.quizAttempts}`,
                        data: result,
                        attemptsLeft: 3 - enrollment.quizAttempts
                    });
                }
            }
        }

        // في حال كان اختباراً عاماً وليس لكورس (مثل اختبار المسار)
        res.status(201).json({
            success: true,
            message: `Quiz submitted! You scored ${score}/${total}.`,
            data: result
        });
    } catch (error) {
        console.error('Quiz submit error:', error);
        res.status(500).json({ message: 'Server error submitting quiz.' });
    }
};

// ─── 3. دالة جلب نتائج الاختبارات السابقة للطالب ───
// يا ويل اللي ما يذاكر! هذي الدالة حقت الاختبارات، نشوف من ينجح ومن يجيب العيد
exports.getQuizResults = async (req, res) => {
    try {
        const results = await QuizResult.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']] // الترتيب من الأحدث للأقدم
        });

        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Quiz results error:', error);
        res.status(500).json({ message: 'Server error fetching quiz results.' });
    }
};
