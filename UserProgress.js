const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const UserProgress = sequelize.define('UserProgress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // userId and videoId are added automatically by Sequelize associations
}, {
    timestamps: true // Adds createdAt (as completion time) and updatedAt
});

module.exports = UserProgress;