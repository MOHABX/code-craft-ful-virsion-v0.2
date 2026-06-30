const express = require('express');
const router = express.Router();
const {
    registerUser, verifyOTP, loginUser, getMe, deleteMe,
    updateDetails, updatePassword, forgotPassword, resetPassword, resendOTP, logoutUser, refreshToken
} = require('../authController');
const { protect } = require('../middlewares/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// --- وسيط رفع الصورة الشخصية ---
const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
        // معرف المستخدم (req.user.id) آمن هنا لأن وسيط الحماية يعمل قبل هذا الوسيط
        const uniqueSuffix = req.user.id + '-' + Date.now() + path.extname(file.originalname);
        cb(null, uniqueSuffix);
    }
});

const uploadAvatar = multer({
    storage: avatarStorage,
    fileFilter: (req, file, cb) => {
        const allowed = /jpeg|jpg|png|webp/;
        if (allowed.test(path.extname(file.originalname).toLowerCase())) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 } // الحد الأقصى 2 ميجابايت
});

// @مسار  POST /api/auth/register
// @وصف   تسجيل مستخدم جديد وإرسال رمز التحقق (OTP)
// يا ولد هذا الدرب للزوار الجدد، يسجلون علومهم عندنا عشان نصير ربع
router.post('/register', registerUser);

// @مسار  POST /api/auth/verify
// @وصف   التحقق من رمز OTP للمستخدم
// هذي حقت التحقق يا خوي، نبعت له كود ونشوف هو صاحب الحلال ولا نصاب
router.post('/verify', verifyOTP);

// @مسار  POST /api/auth/resend-otp
// @وصف   إعادة إرسال رمز OTP لمستخدم غير مفعل
// يا رفيقي هني بوابة الدخول، نشيك على هوية الرجال وندخله إذا علمه غانم
router.post('/resend-otp', resendOTP);

// @مسار  POST /api/auth/login
// @وصف   تسجيل الدخول
// يا رفيقي هني بوابة الدخول، نشيك على هوية الرجال وندخله إذا علمه غانم
router.post('/login', loginUser);

// @مسار  POST /api/auth/logout
// @وصف   تسجيل الخروج وإبطال رمز التحديث
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.post('/logout', logoutUser);

// @مسار  POST /api/auth/refresh
// @وصف   الحصول على رمز وصول جديد باستخدام رمز التحديث
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.post('/refresh', refreshToken);

// @مسار  GET /api/auth/me
// @وصف   جلب بيانات المستخدم المسجل دخوله
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.get('/me', protect, getMe);

// @مسار  PUT /api/auth/me/photo
// @وصف   رفع صورة الملف الشخصي (يعمل الحماية أولاً، ثم multer — معرف المستخدم آمن)
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.put('/me/photo', protect, uploadAvatar.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No image file uploaded.' });
        }
        const user = req.user;
        user.profilePic = `/uploads/avatars/${req.file.filename}`;
        await user.save();
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error('Avatar upload error:', error);
        res.status(500).json({ message: 'Error uploading photo.' });
    }
});

// @مسار  DELETE /api/auth/me
// @وصف   حذف حساب المستخدم المسجل دخوله
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.delete('/me', protect, deleteMe);

// @مسار  PUT /api/auth/me/details
// @وصف   تحديث تفاصيل المستخدم (الاسم)
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.put('/me/details', protect, updateDetails);

// @مسار  PUT /api/auth/me/password
// @وصف   تحديث كلمة المرور
// هني نجيب ملف الرجال وعلومه الشخصية، عشان نعرف مع مين نسولف
router.put('/me/password', protect, updatePassword);

// @مسار  POST /api/auth/forgotpassword
// @وصف   نسيت كلمة المرور
// هذي حقت التحقق يا خوي، نبعت له كود ونشوف هو صاحب الحلال ولا نصاب
router.post('/forgotpassword', forgotPassword);

// @مسار  PUT /api/auth/resetpassword/:token
// @وصف   إعادة تعيين كلمة المرور
// الرجال ضيع مفتاحه! هني نضبط له كلمة سر جديدة عشان يرجع لداره
router.put('/resetpassword/:token', resetPassword);

module.exports = router;