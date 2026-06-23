const { DataTypes } = require('sequelize'); // استدعاء أنواع البيانات من مكتبة Sequelize
const { sequelize } = require('./db'); // استدعاء متغير الاتصال بقاعدة البيانات

// ─── تعريف نموذج الفيديو (Video Model) ───
// هذا النموذج يمثل جدول الفيديوهات المرتبطة بالكورسات في قاعدة البيانات
const Video = sequelize.define('Video', {
    title: {
        type: DataTypes.STRING, // عنوان الفيديو (نص)
        allowNull: false, // لا يمكن أن يكون فارغاً
    },
    path: {
        type: DataTypes.STRING, // مسار حفظ ملف الفيديو الفعلي على الخادم
        allowNull: false, // لا يمكن أن يكون فارغاً
    },
    // ملاحظة: معرف المحاضر (instructorId) ومعرف الكورس (courseId)
    // سيتم إضافتهما تلقائياً بواسطة Sequelize بناءً على العلاقات (Associations) المعرفة في مكان آخر
});

module.exports = Video;