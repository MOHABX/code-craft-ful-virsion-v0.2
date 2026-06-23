const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');

// ─── إعدادات الاتصال بقاعدة البيانات باستخدام مكتبة Sequelize ───
// نقوم بإنشاء مثيل جديد (Instance) يربطنا بقاعدة بيانات MySQL بناءً على المتغيرات البيئية
const sequelize = new Sequelize(
    process.env.DB_NAME,       // اسم قاعدة البيانات
    process.env.DB_USER,       // اسم المستخدم 
    process.env.DB_PASSWORD,   // كلمة المرور
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT || 'mysql', // نوع قاعدة البيانات
        logging: false, // تم إيقاف طباعة استعلامات SQL في الـ Console لتقليل الإزعاج
    }
);

// ─── دالة الاتصال بقاعدة البيانات وتهيئتها (connectDB) ───
const connectDB = async () => {
    try {
        // 1. الاتصال المبدئي بسيرفر MySQL للتحقق من وجود قاعدة البيانات
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
        });
        
        // 2. إنشاء قاعدة البيانات برمجياً إذا لم تكن موجودة بالفعل
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
        await connection.end(); // إنهاء الاتصال المبدئي

        // 3. اختبار الاتصال الفعلي بقاعدة البيانات عبر Sequelize
        await sequelize.authenticate();
        console.log(`✅ MySQL Connected Successfully.`);

        // 🔥 التعديل هنا: إيقاف alterSync لتجنب مشكلة تراكم الفهارس ER_TOO_MANY_KEYS
        // عند تعيين هذه القيمة لـ false، لن يقوم السيرفر بتعديل بنية الجداول الموجودة مسبقاً بقوة
        const alterSync = false; 

        // 4. استدعاء جميع نماذج البيانات (Models) لتعريفها داخل النظام قبل عملية المزامنة
        require('./User'); // نموذج المستخدمين
        require('./Course'); // نموذج الكورسات
        require('./Video'); // نموذج الفيديوهات
        require('./Enrollment'); // نموذج الاشتراكات (الربط بين الطالب والكورس)
        require('./QuizResult'); // نموذج نتائج الاختبارات
        require('./Review'); // نموذج التقييمات
        require('./Certificate'); // نموذج الشهادات
        require('./UserProgress'); // نموذج التقدم العام
        require('./UserVideoProgress'); // نموذج تتبع مشاهدة الفيديوهات
        require('./BlockedDevice'); // نموذج الأجهزة المحظورة لدواعي أمنية
        require('./RefreshToken'); // نموذج رموز تحديث جلسات الدخول
        require('./AdminEmail'); // نموذج إيميلات الإدارة للإشعارات

        // 5. مزامنة النماذج مع قاعدة البيانات (إنشاء الجداول إن لم تكن موجودة)
        await sequelize.sync({ alter: alterSync });
        
        console.log("✅ All models were synchronized successfully.");

    } catch (error) {
        // التقاط وطباعة أي خطأ يحدث أثناء الاتصال بقاعدة البيانات
        console.error(`❌ Unable to connect to the database:`, error);
    }
}

// تصدير متغير الاتصال والدالة لاستخدامهما في باقي أجزاء التطبيق (مثل ملف server.js والمتحكمات)
module.exports = { sequelize, connectDB };