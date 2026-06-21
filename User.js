const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Course = require('./Course');
const Video = require('./Video');
const Certificate = require('./Certificate');
const Enrollment = require('./Enrollment');
const QuizResult = require('./QuizResult');
const Review = require('./Review');

const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('student', 'doctor', 'admin'),
        defaultValue: 'student'
    },
    profilePic: {
        type: DataTypes.STRING,
        defaultValue: 'default-avatar.png',
    },
    bio: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
    otp: {
        type: DataTypes.STRING,
    },
    otpExpires: {
        type: DataTypes.DATE,
    },
    otpAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    passwordResetToken: {
        type: DataTypes.STRING,
    },
    passwordResetExpire: {
        type: DataTypes.DATE,
    }
}, {
    defaultScope: {
        attributes: { exclude: ['password', 'otp', 'otpExpires', 'passwordResetToken', 'passwordResetExpire'] },
    },
    scopes: {
        withPassword: { attributes: {} }
    },
    hooks: {
        beforeCreate: async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
User.prototype.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpire = Date.now() + 10 * 60 * 1000;
    return resetToken;
};

// ─── Associations ─────────────────────────────────────────────────────────────

// Instructor → Courses
User.hasMany(Course, { foreignKey: 'instructorId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

// Student ↔ Course (Enrollment)
User.belongsToMany(Course, { through: Enrollment, as: 'enrolledCourses', foreignKey: 'userId' });
Course.belongsToMany(User, { through: Enrollment, as: 'enrolledStudents', foreignKey: 'courseId' });

// Student ↔ Video (Progress)
const UserVideoProgress = require('./UserVideoProgress');
User.belongsToMany(Video, { through: UserVideoProgress, as: 'completedVideos', foreignKey: 'userId' });
Video.belongsToMany(User, { through: UserVideoProgress, as: 'completedByUsers', foreignKey: 'videoId' });

// User → Certificates
User.hasMany(Certificate, { foreignKey: 'userId' });
Certificate.belongsTo(User, { foreignKey: 'userId' });

// User → QuizResults
User.hasMany(QuizResult, { foreignKey: 'userId' });
QuizResult.belongsTo(User, { foreignKey: 'userId' });

// User → Reviews
User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });

// Course → Reviews
Course.hasMany(Review, { foreignKey: 'courseId' });
Review.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = User;