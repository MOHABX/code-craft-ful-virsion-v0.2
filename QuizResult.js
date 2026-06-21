const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const QuizResult = sequelize.define('QuizResult', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    track: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    score: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    total: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    courseId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    // userId added via association in User.js
}, {
    timestamps: true
});

module.exports = QuizResult;
