const { GoogleGenerativeAI } = require("@google/generative-ai");
const QuizResult = require('./QuizResult');
const Enrollment = require('./Enrollment');
const Course = require('./Course');
const Certificate = require('./Certificate');
const UserVideoProgress = require('./UserVideoProgress');
const Video = require('./Video');

exports.generateQuiz = async (req, res) => {
    const track = req.query.track || 'Web Development';
    const courseId = req.query.courseId;

    try {
        if (courseId) {
            const enrollment = await Enrollment.findOne({ where: { userId: req.user.id, courseId: courseId } });
            if (!enrollment) {
                return res.status(403).json({ error: "You are not enrolled in this course." });
            }
            if (enrollment.quizAttempts >= 3) {
                return res.status(403).json({ error: "You have exceeded the maximum number of attempts. You must restart the course.", maxAttemptsReached: true });
            }
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API Key for Gemini is missing in .env" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a tech expert. Generate exactly 30 multiple-choice questions in the field of ${track} in English.
        The response must be in JSON format only, an array of objects exactly like this, with no additional text:
        [{"question": "Question?", "options": ["A", "B", "C", "D"], "correct": 0}]`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '');
        const questionsData = JSON.parse(responseText);

        res.json({ questions: questionsData });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ error: "Failed to generate questions from AI" });
    }
};

exports.submitQuiz = async (req, res) => {
    const { track, score, total, courseId } = req.body;

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
        const result = await QuizResult.create({
            userId: req.user.id,
            track,
            score,
            total,
            courseId: courseId || null
        });

        if (courseId) {
            const enrollment = await Enrollment.findOne({ where: { userId: req.user.id, courseId: courseId } });
            if (enrollment) {
                const passScore = Math.ceil(total * 0.9);
                if (score >= passScore) {
                    enrollment.status = 'completed';
                    enrollment.quizAttempts = 0;
                    await enrollment.save();

                    const course = await Course.findByPk(courseId);
                    
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
                        certificateId: cert.id
                    });
                } else {
                    enrollment.quizAttempts += 1;
                    await enrollment.save();

                    if (enrollment.quizAttempts >= 3) {
                        const courseVideos = await Video.findAll({ where: { courseId: courseId } });
                        const videoIds = courseVideos.map(v => v.id);
                        if (videoIds.length > 0) {
                            await UserVideoProgress.destroy({ where: { userId: req.user.id, videoId: videoIds } });
                        }
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

exports.getQuizResults = async (req, res) => {
    try {
        const results = await QuizResult.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: results });
    } catch (error) {
        console.error('Quiz results error:', error);
        res.status(500).json({ message: 'Server error fetching quiz results.' });
    }
};
