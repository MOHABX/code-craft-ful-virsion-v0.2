const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const Enrollment = sequelize.define('Enrollment', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    quizAttempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    status: {
        type: DataTypes.ENUM('in-progress', 'completed', 'failed'),
        defaultValue: 'in-progress',
    }
    // تتم إضافة المعرفات تلقائيا بواسطة روابط Sequelize
}, {
    timestamps: true // لتتبع متى قام المستخدم بالتسجيل
});

module.exports = Enrollment;