
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
require('dotenv').config();
const User = require('./User');
const Course = require('./Course');
const Video = require('./Video');
const Enrollment = require('./Enrollment');
const QuizResult = require('./QuizResult');
const Certificate = require('./Certificate');
const UserVideoProgress = require('./UserVideoProgress');
const jwt = require('jsonwebtoken');

const API_BASE = 'http://localhost:5000/api';

async function generateToken(email) {
    const user = await User.findOne({ where: { email } });
    if (!user) throw new Error('User not found: ' + email);
    return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

async function run() {
    console.log('=== STARTING TEST WITH EXISTING ACCOUNTS ===');
    
    // 1. Get tokens
    const instToken = await generateToken('mohabfahd015@gmail.com');
    const studToken = await generateToken('codecraft210@gmail.com');
    console.log('✅ Tokens generated');

    // 2. Instructor creates a course
    const courseRes = await fetch(`${API_BASE}/courses`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${instToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            title: 'Fullstack Course ' + Date.now(),
            description: 'Learn everything about fullstack development.',
            category: 'Web Development',
            level: 'Beginner'
        })
    });
    const courseData = await courseRes.json();
    if (!courseData.success) throw new Error('Course creation failed: ' + JSON.stringify(courseData));
    const courseId = courseData.data.id;
    console.log('✅ Course Created. ID:', courseId);

    // 3. Instructor gets their courses
    const myCoursesRes = await fetch(`${API_BASE}/courses/mycourses`, {
        headers: { 'Authorization': `Bearer ${instToken}` }
    });
    const myCoursesData = await myCoursesRes.json();
    if (!myCoursesData.data.some(c => c.id === courseId)) {
        throw new Error('Created course not found in mycourses');
    }
    console.log('✅ Course found in instructor dashboard');

    // 4. Instructor uploads a video
    const formData = new FormData();
    const testFilePath = path.join(__dirname, 'test_video.mp4');
    if (!fs.existsSync(testFilePath)) fs.writeFileSync(testFilePath, 'dummy video content');
    formData.append('videos', fs.createReadStream(testFilePath), 'test_video.mp4');
    formData.append('titles', JSON.stringify(['Intro Video']));

    const uploadRes = await fetch(`${API_BASE}/videos/upload/${courseId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${instToken}` },
        body: formData
    });
    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error('Video upload failed: ' + JSON.stringify(uploadData));
    const videoId = uploadData.data[0].id;
    console.log('✅ Video Uploaded. ID:', videoId);

    // 5. Student enrolls
    const enrollRes = await fetch(`${API_BASE}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${studToken}` }
    });
    const enrollData = await enrollRes.json();
    if (!enrollData.success && enrollData.message !== 'You are already enrolled in this course.') {
        throw new Error('Enrollment failed: ' + JSON.stringify(enrollData));
    }
    console.log('✅ Student enrolled successfully');

    // 6. Student marks video complete
    const completeRes = await fetch(`${API_BASE}/videos/${videoId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${studToken}` }
    });
    const completeData = await completeRes.json();
    if (!completeData.success) throw new Error('Mark video complete failed: ' + JSON.stringify(completeData));
    console.log('✅ Video marked as complete');

    // 7. Student submits Quiz and passes
    const quizRes = await fetch(`${API_BASE}/quiz/submit`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${studToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            track: 'Web Development',
            score: 30,
            total: 30,
            courseId: courseId
        })
    });
    const quizData = await quizRes.json();
    if (!quizData.success) throw new Error('Quiz submit failed: ' + JSON.stringify(quizData));
    console.log('✅ Quiz Submitted! Passed:', quizData.passed);

    // 8. Verify certificate
    const certsRes = await fetch(`${API_BASE}/certificates/me`, {
        headers: { 'Authorization': `Bearer ${studToken}` }
    });
    const certsData = await certsRes.json();
    const hasCert = certsData.data.some(c => c.courseId === courseId);
    if (!hasCert) throw new Error('Certificate not found');
    console.log('✅ Certificate VERIFIED');

    console.log('=== ALL TESTS WITH EXISTING ACCOUNTS PASSED ===');
}

run().catch(err => {
    console.error('❌ TEST FAILED:', err);
    process.exit(1);
});
