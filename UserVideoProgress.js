const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');

const UserVideoProgress = sequelize.define('UserVideoProgress', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    // تمت إضافة معرف المستخدم ومعرف الفيديو تلقائياً عبر روابط Sequelize
}, {
    timestamps: true // لمعرفة متى تم إكمال الفيديو
});

module.exports = UserVideoProgress;