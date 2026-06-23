const { DataTypes } = require('sequelize');
const { sequelize } = require('./db');
const crypto = require('crypto'); // مكتبة للعمليات المشفرة (توليد رموز استعادة كلمة المرور)
const bcrypt = require('bcryptjs'); // مكتبة لتشفير كلمة المرور قبل حفظها في الداتا بيز
const Course = require('./Course');
const Video = require('./Video');
const Certificate = require('./Certificate');
const Enrollment = require('./Enrollment');
const QuizResult = require('./QuizResult');
const Review = require('./Review');

// ─── تعريف نموذج المستخدم (User Model) ───
// هذا النموذج يمثل جدول Users في قاعدة البيانات
const User = sequelize.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false, // لا يمكن أن يكون فارغاً
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true, // الإيميل يجب أن يكون مميزاً ولا يتكرر
        validate: { isEmail: true }, // التأكد من أن المدخل بصيغة إيميل صحيحة
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('student', 'doctor', 'admin'), // نوع الحساب (طالب، محاضر، أدمن)
        defaultValue: 'student' // النوع الافتراضي هو طالب
    },
    profilePic: {
        type: DataTypes.STRING,
        defaultValue: 'default-avatar.png', // صورة افتراضية للملف الشخصي
    },
    bio: {
        type: DataTypes.TEXT, // نبذة عن المستخدم
        allowNull: true,
    },
    isVerified: {
        type: DataTypes.BOOLEAN, // هل قام المستخدم بتفعيل حسابه عبر الـ OTP؟
        defaultValue: false,
    },
    otp: {
        type: DataTypes.STRING, // رمز التفعيل
    },
    otpExpires: {
        type: DataTypes.DATE, // تاريخ ووقت انتهاء صلاحية رمز التفعيل
    },
    otpAttempts: {
        type: DataTypes.INTEGER, // عدد المحاولات الخاطئة لإدخال الـ OTP
        defaultValue: 0,
    },
    passwordResetToken: {
        type: DataTypes.STRING, // رمز خاص باستعادة كلمة المرور (في حال نسيانها)
    },
    passwordResetExpire: {
        type: DataTypes.DATE, // تاريخ انتهاء صلاحية رمز استعادة كلمة المرور
    }
}, {
    // ─── إعدادات نطاق البيانات (Scopes) ───
    defaultScope: {
        // عند جلب بيانات المستخدم، يتم استبعاد هذه الحقول الحساسة لكي لا تُرسل للواجهة الأمامية
        attributes: { exclude: ['password', 'otp', 'otpExpires', 'passwordResetToken', 'passwordResetExpire'] },
    },
    scopes: {
        // نطاق يُستخدم عندما نحتاج للتحقق من كلمة المرور أثناء تسجيل الدخول
        withPassword: { attributes: {} }
    },
    // ─── الخطافات (Hooks) ───
    // وظائف تعمل تلقائياً قبل أو بعد عمليات معينة في قاعدة البيانات
    hooks: {
        // قبل إنشاء مستخدم جديد: يتم تشفير كلمة المرور
        beforeCreate: async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        },
        // قبل تحديث بيانات المستخدم: إذا تم تغيير كلمة المرور، قم بتشفيرها مرة أخرى
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// ─── دوال إضافية للمستخدم (Instance Methods) ───
// دالة لإنشاء رمز استعادة كلمة المرور (Reset Password Token)
User.prototype.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString('hex'); // توليد رمز عشوائي
    // تشفير الرمز وحفظه في قاعدة البيانات لضمان الأمان
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpire = Date.now() + 10 * 60 * 1000; // صلاحيته 10 دقائق
    return resetToken; // إرجاع الرمز غير المشفر لإرساله في الإيميل
};

// ─── العلاقات بين الجداول (Associations) ───

// علاقة المحاضر بالكورسات (1:N) - المحاضر يملك العديد من الكورسات
User.hasMany(Course, { foreignKey: 'instructorId', as: 'courses' });
Course.belongsTo(User, { foreignKey: 'instructorId', as: 'instructor' });

// علاقة الطالب بالكورسات المشترك بها (N:M عبر جدول Enrollment)
User.belongsToMany(Course, { through: Enrollment, as: 'enrolledCourses', foreignKey: 'userId' });
Course.belongsToMany(User, { through: Enrollment, as: 'enrolledStudents', foreignKey: 'courseId' });

// علاقة الطالب بالفيديوهات التي أكمل مشاهدتها (N:M عبر جدول UserVideoProgress)
const UserVideoProgress = require('./UserVideoProgress');
User.belongsToMany(Video, { through: UserVideoProgress, as: 'completedVideos', foreignKey: 'userId' });
Video.belongsToMany(User, { through: UserVideoProgress, as: 'completedByUsers', foreignKey: 'videoId' });

// علاقة المستخدم بالشهادات التي حصل عليها (1:N)
User.hasMany(Certificate, { foreignKey: 'userId' });
Certificate.belongsTo(User, { foreignKey: 'userId' });

// علاقة المستخدم بنتائج الاختبارات التي أداها (1:N)
User.hasMany(QuizResult, { foreignKey: 'userId' });
QuizResult.belongsTo(User, { foreignKey: 'userId' });

// علاقة المستخدم بالتقييمات التي كتبها (1:N)
User.hasMany(Review, { foreignKey: 'userId' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'reviewer' });

// علاقة الكورس بالتقييمات التي كُتبت عنه (1:N)
Course.hasMany(Review, { foreignKey: 'courseId' });
Review.belongsTo(Course, { foreignKey: 'courseId' });

module.exports = User;