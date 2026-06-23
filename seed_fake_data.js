require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { connectDB } = require('./db');
const User = require('./User');
const Course = require('./Course');
const Video = require('./Video');
const Enrollment = require('./Enrollment');

async function seedData() {
    try {
        await connectDB();
        
        console.log("Starting to seed dummy data...");

        // Create Instructor
        const instructorEmail = 'dr_ahmed@test.com';
        const instructorPass = 'password123';
        let [instructor, instCreated] = await User.findOrCreate({
            where: { email: instructorEmail },
            defaults: {
                name: 'Dr. Ahmed Khaled',
                email: instructorEmail,
                phone: '01011122233',
                password: instructorPass,
                role: 'doctor',
                isVerified: true
            }
        });
        if (!instCreated) {
            instructor.password = instructorPass;
            await instructor.save();
        }
        
        // Create Student
        const studentEmail = 'ali_student@test.com';
        const studentPass = 'password123';
        let [student, studCreated] = await User.findOrCreate({
            where: { email: studentEmail },
            defaults: {
                name: 'Ali Youssef',
                email: studentEmail,
                phone: '01099988877',
                password: studentPass,
                role: 'student',
                isVerified: true
            }
        });
        if (!studCreated) {
            student.password = studentPass;
            await student.save();
        }

        // Create Courses
        const c1 = await Course.create({
            title: 'Mastering React.js 2026',
            description: 'Complete guide to React from zero to hero.',
            category: 'Web Development',
            level: 'Intermediate',
            instructorId: instructor.id
        });
        
        const c2 = await Course.create({
            title: 'Node.js Backend Architecture',
            description: 'Learn how to build scalable backends with Express and Sequelize.',
            category: 'Cloud',
            level: 'Advanced',
            instructorId: instructor.id
        });
        
        const c3 = await Course.create({
            title: 'UI/UX Design Principles',
            description: 'Learn Figma and design stunning interfaces.',
            category: 'Other',
            level: 'Beginner',
            instructorId: instructor.id
        });
        
        const coursesDir = path.join(__dirname, 'uploads', 'courses');
        if (!fs.existsSync(coursesDir)) fs.mkdirSync(coursesDir, { recursive: true });
        
        const c1Dir = path.join(coursesDir, c1.id.toString());
        if (!fs.existsSync(c1Dir)) fs.mkdirSync(c1Dir);

        await Video.create({
            title: 'Introduction to React',
            path: `/uploads/courses/${c1.id}/dummy1.mp4`,
            courseId: c1.id
        });
        await Video.create({
            title: 'State and Props',
            path: `/uploads/courses/${c1.id}/dummy2.mp4`,
            courseId: c1.id
        });
        
        // Enroll Student in c1
        await Enrollment.findOrCreate({
            where: { userId: student.id, courseId: c1.id }
        });

        console.log("Seeding done successfully!");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seedData();
