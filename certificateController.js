const Certificate = require('./Certificate');
const Video = require('./Video');
const UserVideoProgress = require('./UserVideoProgress');
const { Op } = require('sequelize');

// هذي الدالة تجيب علوم الدورات والكورسات، عشان الربع يستفيدون ويتعلمون
exports.issueCertificate = async (req, res) => {
    const { courseId, courseName } = req.body;
    const userId = req.user.id;

    if (!courseId || !courseName) {
        return res.status(400).json({ message: 'Course ID and Course Name are required.' });
    }

    try {
        const existingCertificate = await Certificate.findOne({
            where: { userId, courseId }
        });

        if (existingCertificate) {
            return res.status(400).json({ message: 'Certificate for this course has already been issued.' });
        }

        const courseVideos = await Video.findAll({
            where: { courseId },
            attributes: ['id']
        });
        const totalVideos = courseVideos.length;

        if (totalVideos > 0) {
            const courseVideoIds = courseVideos.map(v => v.id);
            const completedCount = await UserVideoProgress.count({
                where: {
                    userId,
                    videoId: { [Op.in]: courseVideoIds }
                }
            });

            if (completedCount < totalVideos) {
                return res.status(400).json({
                    message: `You must complete all course videos first. Progress: ${completedCount}/${totalVideos} videos.`,
                    progress: { completed: completedCount, total: totalVideos }
                });
            }
        }

        const newCertificate = await Certificate.create({
            userId,
            courseId: parseInt(courseId),
            courseName
        });

        res.status(201).json({
            success: true,
            message: 'Certificate issued successfully!',
            data: newCertificate
        });

    } catch (error) {
        console.error("Error issuing certificate:", error);
        res.status(500).json({ message: 'Server error while issuing certificate.' });
    }
};

// هني نطبع الشهادة للناجحين، شهادة ترفع الراس وتبيض الوجه
exports.getMyCertificates = async (req, res) => {
    try {
        const certificates = await Certificate.findAll({
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({ success: true, data: certificates });
    } catch (error) {
        console.error("Error fetching user certificates:", error);
        res.status(500).json({ message: 'Server error while fetching certificates.' });
    }
};
