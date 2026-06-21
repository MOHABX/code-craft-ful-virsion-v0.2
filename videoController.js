const UserVideoProgress = require('./UserVideoProgress');
const Video = require('./Video');
const Course = require('./Course');
const fs = require('fs');
const path = require('path');

exports.uploadVideos = async (req, res) => {
    try {
        const courseId = req.params.courseId;

        const course = await Course.findByPk(courseId);
        if (!course) {
            if (req.files) req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
            return res.status(404).json({ message: 'Course not found.' });
        }
        if (course.instructorId !== req.user.id && req.user.role !== 'admin') {
            if (req.files) req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
            return res.status(403).json({ message: 'Not authorized to upload to this course.' });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ message: 'No video files uploaded.' });
        }

        const titles = req.body.titles ? JSON.parse(req.body.titles) : [];

        const videoRecords = await Promise.all(
            req.files.map((file, index) => {
                const title = (titles[index] && titles[index].trim())
                    ? titles[index].trim()
                    : file.originalname.replace(/\.[^.]+$/, '').replace(/_/g, ' ');
                const videoPath = `/uploads/courses/${courseId}/${file.filename}`;
                return Video.create({ title, path: videoPath, courseId });
            })
        );

        res.status(201).json({
            success: true,
            message: `${videoRecords.length} video(s) uploaded successfully!`,
            data: videoRecords
        });
    } catch (error) {
        if (req.files) req.files.forEach(f => fs.existsSync(f.path) && fs.unlinkSync(f.path));
        console.error('Bulk upload error:', error);
        res.status(500).json({ message: error.message || 'Server error during upload.' });
    }
};

exports.markVideoComplete = async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.videoId);
        if (!video) return res.status(404).json({ message: 'Video not found.' });

        const [progress, created] = await UserVideoProgress.findOrCreate({
            where: { userId: req.user.id, videoId: req.params.videoId }
        });

        if (!created) return res.status(200).json({ success: true, message: 'Video was already marked as complete.' });
        res.status(201).json({ success: true, message: 'Video marked as complete!' });
    } catch (error) {
        console.error("Error marking video as complete:", error);
        res.status(500).json({ message: 'Server error while marking video complete.' });
    }
};

exports.deleteVideo = async (req, res) => {
    try {
        const video = await Video.findByPk(req.params.videoId);
        if (!video) return res.status(404).json({ message: 'Video not found.' });

        const course = await Course.findByPk(video.courseId);
        if (!course || (course.instructorId !== req.user.id && req.user.role !== 'admin')) {
            return res.status(403).json({ message: 'Not authorized to delete this video.' });
        }

        const filePath = path.join(__dirname, '..', video.path);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await video.destroy();
        res.status(200).json({ success: true, message: 'Video deleted successfully.' });
    } catch (error) {
        console.error('Video delete error:', error);
        res.status(500).json({ message: 'Server error deleting video.' });
    }
};
