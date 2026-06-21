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
    // userId and courseId are added automatically by Sequelize associations
}, {
    timestamps: true // To track when a user enrolled
});

module.exports = Enrollment;