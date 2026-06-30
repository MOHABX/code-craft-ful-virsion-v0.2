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
    // تتم إضافة معرف المستخدم ومعرف الدورة عبر الروابط (associations)
}, {
    timestamps: true // يضيف تاريخ الإنشاء وتاريخ التحديث
});

module.exports = Certificate;