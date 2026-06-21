const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const UserVideoProgress = sequelize.define('UserVideoProgress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // userId and videoId are added automatically by Sequelize associations
}, {
    timestamps: true // To know when the video was completed
});

module.exports = UserVideoProgress;