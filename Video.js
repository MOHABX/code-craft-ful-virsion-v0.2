const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const Video = sequelize.define('Video', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    path: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    // instructorId and courseId will be added automatically via associations
});

module.exports = Video;