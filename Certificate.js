const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const { v4: uuidv4 } = require('uuid');

const Certificate = sequelize.define('Certificate', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    uniqueId: {
        type: DataTypes.UUID,
        defaultValue: uuidv4,
        unique: true,
    },
    courseName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    issueDate: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    // userId and courseId are added via associations
}, {
    timestamps: true // Adds createdAt and updatedAt
});

module.exports = Certificate;