const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const UserProgress = sequelize.define('UserProgress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // تمت إضافة معرف المستخدم ومعرف الفيديو تلقائياً عبر روابط Sequelize
}, {
    timestamps: true // يضيف تاريخ الإنشاء (كوقت الإكمال) وتاريخ التحديث
});

module.exports = UserProgress;