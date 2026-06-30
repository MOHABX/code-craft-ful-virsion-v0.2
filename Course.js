const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const Video = require('./Video');
const Certificate = require('./Certificate');

const Course = sequelize.define('Course', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    thumbnail: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
    },
    category: {
        type: DataTypes.ENUM('Web Development', 'Mobile Development', 'Data Science', 'Cloud', 'Security', 'Networking', 'Other'),
        defaultValue: 'Other',
    },
    level: {
        type: DataTypes.ENUM('Beginner', 'Intermediate', 'Advanced'),
        defaultValue: 'Beginner',
    },
    // يتم إضافة معرف المدرب عبر الروابط
});

Course.hasMany(Video, { foreignKey: 'courseId', as: 'videos' });
Video.belongsTo(Course, { foreignKey: 'courseId' });

Course.hasMany(Certificate, { foreignKey: 'courseId' });
Certificate.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = Course;