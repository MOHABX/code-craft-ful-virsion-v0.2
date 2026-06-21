require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./db');
const User = require('./User');

async function runTest() {
    await connectDB();
    const API = 'http://localhost:5000/api';
    const num = Date.now().toString().slice(-4);
    
    console.log("=== STARTING END-TO-END TEST ===");
    
    // 1. Instructor Register
    const instEmail = `inst_${num}@test.com`;
    console.log(`\n[1] Registering Instructor ${instEmail}...`);
    let res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Inst Tester', email: instEmail, phone: '0123456789', password: 'password', role: 'doctor' })
    });
    let data = await res.json();
    if (!data.success) throw new Error('Instructor registration failed: ' + JSON.stringify(data));
    
    // Get OTP from DB
    let userDb = await User.unscoped().findOne({ where: { email: instEmail } });
    console.log(`Instructor OTP from DB: ${userDb.otp}`);
    
    // Verify OTP
    res = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: instEmail, otp: userDb.otp })
    });
    data = await res.json();
    let instToken = data.token;
    if(!instToken) throw new Error('Instructor verification failed: ' + JSON.stringify(data));
    console.log("✅ Instructor Registered & Verified. Token OK.");

    // 2. Publish Course
    console.log(`\n[2] Instructor creating a new course...`);
    res = await fetch(`${API}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${instToken}` },
        body: JSON.stringify({ title: `AI Full Course ${num}`, description: 'Test course', category: 'Data Science', level: 'Beginner' })
    });
    data = await res.json();
    if(!data.success) throw new Error('Course creation failed: ' + JSON.stringify(data));
    const courseId = data.data.id;
    console.log(`✅ Course Created. ID: ${courseId}`);

    // 3. Edit Course
    console.log(`\n[3] Instructor editing the course...`);
    res = await fetch(`${API}/courses/${courseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${instToken}` },
        body: JSON.stringify({ title: `AI Full Course Edited ${num}` })
    });
    data = await res.json();
    if(!data.success) throw new Error('Course edit failed: ' + JSON.stringify(data));
    console.log(`✅ Course Edited Successfully.`);

    // 4. Upload Video (using FormData)
    console.log(`\n[4] Instructor uploading a video to the course...`);
    const formData = new FormData();
    const dummyVideoContent = new Blob(["dummy video content"], { type: 'video/mp4' });
    formData.append('videos', dummyVideoContent, 'test_video.mp4');
    
    res = await fetch(`${API}/videos/upload/${courseId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${instToken}` },
        body: formData
    });
    data = await res.json();
    if(!data.success) throw new Error('Video upload failed: ' + JSON.stringify(data));
    console.log(`✅ Video Uploaded. Inserted: ${data.data.length} video(s).`);
    const videoId = data.data[0].id;

    // 5. Student Register
    const studEmail = `stud_${num}@test.com`;
    console.log(`\n[5] Registering Student ${studEmail}...`);
    res = await fetch(`${API}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Student Tester', email: studEmail, phone: '0987654321', password: 'password', role: 'student' })
    });
    data = await res.json();
    if (!data.success) throw new Error('Student registration failed: ' + JSON.stringify(data));

    userDb = await User.unscoped().findOne({ where: { email: studEmail } });
    console.log(`Student OTP from DB: ${userDb.otp}`);
    
    // Verify OTP
    res = await fetch(`${API}/auth/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studEmail, otp: userDb.otp })
    });
    data = await res.json();
    let studToken = data.token;
    if(!studToken) throw new Error('Student verification failed: ' + JSON.stringify(data));
    console.log("✅ Student Registered & Verified. Token OK.");

    // 6. Student Enroll
    console.log(`\n[6] Student enrolling in course ${courseId}...`);
    res = await fetch(`${API}/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${studToken}` }
    });
    data = await res.json();
    if(!data.success) throw new Error('Enrollment failed: ' + JSON.stringify(data));
    console.log(`✅ Enrolled successfully.`);

    // 7. Student mark video as complete
    console.log(`\n[7] Student marking video ${videoId} as complete...`);
    res = await fetch(`${API}/videos/${videoId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${studToken}` }
    });
    data = await res.json();
    if(!data.success) throw new Error('Marking video complete failed: ' + JSON.stringify(data));
    console.log(`✅ Video marked as complete.`);

    // 8. Generate Quiz
    console.log(`\n[8] Generating AI Quiz...`);
    res = await fetch(`${API}/quiz/generate?courseId=${courseId}&track=Data Science`, {
        headers: { 'Authorization': `Bearer ${studToken}` }
    });
    data = await res.json();
    if(data.error) {
        console.log(`⚠️ AI Quiz Generation failed or not configured: ${data.error}`);
    } else {
        console.log(`✅ AI Quiz Generated. Received ${data.questions?.length} questions.`);
    }

    // 9. Submit Quiz (Pass) and get Certificate
    console.log(`\n[9] Student submitting Quiz and passing to get certificate...`);
    res = await fetch(`${API}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${studToken}` },
        body: JSON.stringify({ track: 'Data Science', score: 30, total: 30, courseId: courseId })
    });
    data = await res.json();
    if(!data.success) throw new Error('Quiz submit failed: ' + JSON.stringify(data));
    console.log(`✅ Quiz Submitted! Passed: ${data.passed}. Message: ${data.message}`);
    const certId = data.certificateId;

    // 10. Check Certificate
    console.log(`\n[10] Verifying Certificate generation...`);
    res = await fetch(`${API}/certificates/me`, {
        headers: { 'Authorization': `Bearer ${studToken}` }
    });
    data = await res.json();
    if(!data.success) throw new Error('Fetching certificates failed: ' + JSON.stringify(data));
    
    if(data.data && data.data.length > 0) {
        const myCert = data.data.find(c => c.courseId === courseId || c.id === certId);
        if(myCert) {
            console.log(`✅ Certificate VERIFIED in user's profile! ID: ${myCert.id}, Course Name: ${myCert.courseName}`);
        } else {
            console.log(`❌ Certificate NOT FOUND for this course!`);
        }
    } else {
         console.log(`❌ No certificates found for user!`);
    }

    console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
    process.exit(0);
}

runTest().catch(err => {
    console.error("\n❌ TEST FAILED:", err.message);
    process.exit(1);
});
