const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: { min: 1, max: 5 }
    },
    comment: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    // userId and courseId added via associations
}, {
    timestamps: true
});

module.exports = Review;
