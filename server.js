const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// ─── إعداد المتغيرات البيئية (Environment Variables) ───
// يتم تحميل المتغيرات من ملف .env لاستخدامها في التطبيق (مثل البورت، روابط قواعد البيانات، إلخ)
dotenv.config();

// ─── استدعاء المكتبات الأساسية للحماية وإدارة الطلبات ───
const cors = require('cors'); // للسماح للواجهة الأمامية بالتواصل مع الخادم
const rateLimit = require('express-rate-limit'); // لتحديد عدد الطلبات لحماية الخادم من هجمات الـ DDoS
const helmet = require('helmet'); // لزيادة الأمان عبر ضبط بعض رؤوس الـ HTTP Headers
const xss = require('xss-clean'); // لتنظيف المدخلات وحماية الخادم من هجمات البرمجة عبر المواقع (XSS)
const cookieParser = require('cookie-parser'); // لقراءة وإدارة ملفات تعريف الارتباط (Cookies) التي تحتوي على التوكن
const csrf = require('csurf'); // لحماية النماذج من هجمات تزوير الطلبات عبر المواقع
const { connectDB } = require('./db'); // استدعاء دالة الاتصال بقاعدة البيانات

// ─── الاتصال بقاعدة البيانات ───
connectDB();

// ─── إنشاء تطبيق الـ Express ───
const app = express();

// ─── إعدادات تقييد عدد الطلبات (Rate Limiters) ───

// محدد عام: يسمح بـ 100 طلب كحد أقصى لكل 15 دقيقة من نفس الـ IP
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 دقيقة
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many requests, please try again after 15 minutes.' } // رسالة الخطأ عند تخطي الحد
});

// محدد خاص بنظام تسجيل الدخول (لحماية الخادم من هجمات تخمين كلمات المرور Brute Force)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100, // يمكن تقليله في بيئة الإنتاج الحقيقية لزيادة الأمان
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many login attempts, please try again after 15 minutes.' }
});

// ─── البرمجيات الوسيطة (Middlewares) ───

// تفعيل مشاركة الموارد (CORS) وتحديد النطاقات المسموح لها بالاتصال بالخادم
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://localhost:5000'],
    credentials: true, // السماح بإرسال الـ Cookies مع الطلبات
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'csrf-token']
}));

// ضبط إعدادات Helmet لحماية الخادم والسماح بعرض الصور والسكربتات محلياً
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
            imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000", "http://127.0.0.1:5000"],
            mediaSrc: ["'self'", "blob:", "http://localhost:5000", "http://127.0.0.1:5000"],
            connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000"]
        }
    }
})); 

// تطبيق أداة xss لتنظيف المدخلات (تمنع تشغيل سكريبتات خبيثة مُرسلة في الطلب)
app.use(xss()); 
// السماح للخادم بقراءة البيانات المرسلة بصيغة JSON
app.use(express.json());
// تفعيل قارئ الـ Cookies
app.use(cookieParser()); 

// ─── نظام الحماية من هجمات الـ CSRF (مُعطل مؤقتاً في بعض الأجزاء، يُفعل في الإنتاج) ───
const csrfProtection = csrf({ cookie: true });
app.get('/api/csrf-token', csrfProtection, (req, res) => {
    res.json({ csrfToken: req.csrfToken() }); // إرسال التوكن للواجهة ليتم استخدامه في النماذج
});

// ─── تقديم ملفات الواجهة الأمامية الثابتة (Static Files) ───
app.use('/html', express.static(path.join(__dirname, 'html')));
app.use('/script', express.static(path.join(__dirname, 'script')));
app.use('/style', express.static(path.join(__dirname, 'style')));
app.use('/img', express.static(path.join(__dirname, 'img')));

// ─── تقديم ملفات الميديا والفيديوهات المرفوعة بصلاحيات خاصة للمشاهدة ───
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'); // السماح بعرض الفيديوهات والصور عبر النطاقات
    res.setHeader('Access-Control-Allow-Origin', '*');
    next();
}, express.static(path.join(__dirname, 'uploads')));

// تطبيق تقييد الطلبات العام على كل المسارات
app.use(generalLimiter);

// ─── إعداد روابط الموقع (Routes) ───

// عند زيارة المسار الرئيسي يتم توجيه المستخدم لصفحة البداية
app.get('/', (req, res) => {
    res.redirect('/html/home.html');
});

// ربط كل قسم في الـ API بالمتحكم (Controller) الخاص به
app.use('/api/auth', authLimiter, require('./routes/authRoutes')); // مسارات التسجيل وتسجيل الدخول
app.use('/api/quiz', require('./routes/quizRoutes')); // مسارات امتحان الذكاء الاصطناعي
app.use('/api/courses', require('./routes/courseRoutes')); // مسارات الكورسات
app.use('/api/users', require('./routes/userRoutes')); // مسارات إدارة المستخدمين
app.use('/api/videos', require('./routes/videoRoutes')); // مسارات الفيديو (رفع، ومتابعة المشاهدة)
app.use('/api/certificates', require('./routes/certificateRoutes')); // مسارات الشهادات
app.use('/api/admin', require('./routes/adminRoutes')); // مسارات لوحة تحكم الأدمن
app.use('/api/security-actions', require('./routes/adminActionRoutes')); // مسارات إجراءات الحماية (فك الحظر، طرد المستخدمين)
app.use('/api/reviews', require('./routes/reviewRoutes')); // مسارات تقييمات الكورسات
app.use('/api/contact', require('./routes/contactRoutes')); // مسارات نموذج التواصل
app.use('/api/ai', require('./routes/aiRoutes')); // مسارات إضافية للذكاء الاصطناعي إن وُجدت

// ─── معالج الأخطاء العام (Global Error Handler) ───
// أي خطأ يحدث داخل أي مسار يتم اصطياده هنا وإرسال رسالة خطأ منظمة بدل إيقاف الخادم
app.use((err, req, res, next) => {
    console.error('Global Error:', err.stack || err.message);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error'
    });
});

// ─── تحديد منفذ التشغيل وبدء الخادم ───
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running at: http://localhost:${PORT}/html/home.html`);
});
