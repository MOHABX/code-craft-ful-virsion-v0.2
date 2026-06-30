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
    // تمت إضافة معرف المستخدم والدورة عبر الروابط
}, {
    timestamps: true
});

module.exports = Review;
