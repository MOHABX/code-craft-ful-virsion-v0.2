const User = require('./User'); // استدعاء نموذج المستخدم من قاعدة البيانات
const BlockedDevice = require('./BlockedDevice'); // استدعاء نموذج الأجهزة المحظورة
const RefreshToken = require('./RefreshToken'); // استدعاء نموذج توكن التحديث
const AdminEmail = require('./AdminEmail'); // استدعاء نموذج الإيميلات الخاصة بالإدارة
const sendEmail = require('./sendEmail'); // استدعاء دالة إرسال الإيميلات
const crypto = require('crypto'); // مكتبة تشفير مدمجة في Node.js
const bcrypt = require('bcryptjs'); // مكتبة للتحقق من كلمات المرور المشفرة
const jwt = require('jsonwebtoken'); // مكتبة لإنشاء والتحقق من التوكن (JWT)
const { Op } = require('sequelize'); // استدعاء المعاملات الرياضية الخاصة بقاعدة البيانات (مثل أكبر من، أصغر من)

// ─── دالة مساعدة لإنشاء التوكن (Tokens) ───
// تقوم هذه الدالة بإنشاء نوعين من التوكن: Access Token و Refresh Token للمستخدم
const generateTokens = async (user) => {
    // 1. إنشاء Access Token (مفتاح الدخول الأساسي المؤقت)
    const accessToken = jwt.sign(
        { id: user.id, role: user.role }, // تخزين معرف المستخدم وصلاحياته داخل التوكن
        process.env.JWT_SECRET || 'craftcode_secret', // مفتاح التشفير السري
        { expiresIn: '7d' } // مدة الصلاحية (تم تمديدها للتطوير، وفي الإنتاج تُفضل أن تكون قصيرة كـ 15 دقيقة)
    );

    // 2. إنشاء Refresh Token (مفتاح تحديث طويل الأمد)
    const refreshTokenString = crypto.randomBytes(40).toString('hex'); // توليد نص عشوائي مشفر
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // صالح لمدة 30 يوماً

    // حفظ الـ Refresh Token في قاعدة البيانات للرجوع إليه عند انتهاء صلاحية الـ Access Token
    await RefreshToken.create({
        userId: user.id,
        token: refreshTokenString,
        expiresAt
    });

    return { accessToken, refreshTokenString };
};

// ─── دالة مساعدة لإرسال تنبيهات بريدية للأدمن ───
const notifyAdmins = async (subject, message) => {
    // جلب جميع إيميلات الإدارة من قاعدة البيانات
    const admins = await AdminEmail.findAll();
    for (const admin of admins) {
        try {
            await sendEmail({ email: admin.email, subject, message }); // إرسال الإيميل
        } catch (err) {
            console.error('Failed to notify admin:', admin.email); // طباعة خطأ في حال فشل الإرسال
        }
    }
};

// ─── 1. دالة تسجيل مستخدم جديد (Register) ───
exports.registerUser = async (req, res) => {
    // استخراج بيانات المستخدم من الطلب
    const { name, email, phone, password, role } = req.body;

    // التحقق من أن جميع الحقول موجودة
    if (!name || !email || !phone || !password) return res.status(400).json({ message: 'All fields are required.' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters.' });

    try {
        // التحقق مما إذا كان الإيميل مسجلاً من قبل ومُفعل
        const userExists = await User.findOne({ where: { email } });
        if (userExists && userExists.isVerified) return res.status(400).json({ message: 'Email is already registered' });

        // توليد رمز تحقق (OTP) مكون من 9 أرقام ليكون معقداً وصعب التخمين
        const otp = Math.floor(100000000 + Math.random() * 900000000).toString(); 
        const otpExpires = new Date(Date.now() + 40 * 1000); // صلاحية الـ OTP هي 40 ثانية فقط

        // محاولة إيجاد المستخدم أو إنشائه إن لم يكن موجوداً
        const [user, created] = await User.findOrCreate({
            where: { email },
            defaults: { name, email, phone, password, role, otp, otpExpires, otpAttempts: 0 }
        });

        // إذا كان المستخدم موجوداً مسبقاً (لكن غير مُفعل)، نقوم بتحديث بياناته
        if (!created) {
            const salt = await bcrypt.genSalt(10);
            user.name = name;
            user.phone = phone;
            user.password = await bcrypt.hash(password, salt); // تشفير كلمة المرور
            user.role = role;
            user.otp = otp;
            user.otpExpires = otpExpires;
            user.otpAttempts = 0; // تصفير عداد المحاولات الخاطئة
            await user.save({ hooks: false });
        }

        // إعداد نص الإيميل الذي سيصل للمستخدم
        const message = `<h1>Welcome to Craft Code!</h1><p>Your 9-digit verification code is:</p><h2 style="font-family: Courier, monospace; letter-spacing: 5px;">${otp}</h2><p>This code expires in 40 seconds.</p>`;
        
        try {
            // إرسال كود الـ OTP
            await sendEmail({ email: user.email, subject: 'Craft Code Account Verification', message });
            
            // إرسال تنبيه للإدارة بوجود مستخدم جديد
            await notifyAdmins('New User Registration', `<p>A new user registered: ${name} (${email}). Waiting for OTP verification.</p>`);
            
            res.status(201).json({ success: true, message: `A verification code has been sent to ${user.email}` });
        } catch (emailError) {
            // إذا فشل إرسال الإيميل وكان المستخدم جديداً، نقوم بحذفه ليتسنى له المحاولة مجدداً
            if (created) await user.destroy({ force: true });
            res.status(500).json({ message: 'Error sending verification email. Please try again later.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error occurred' });
    }
};

// ─── 2. دالة التحقق من كود الـ OTP (Verify OTP) ───
exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required.' });

    // استخراج معلومات جهاز المستخدم للحماية من محاولات الاختراق (Brute Force)
    const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'Unknown';
    // إنشاء بصمة فريدة للجهاز بناءً على الآي بي ونوع المتصفح
    const deviceHash = crypto.createHash('sha256').update(ipAddress + userAgent).digest('hex');

    try {
        const user = await User.unscoped().findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: 'User not found.' });

        // التحقق مما إذا كان جهاز المستخدم محظوراً
        const isBlocked = await BlockedDevice.findOne({
            where: { deviceHash, blockedUntil: { [Op.gt]: new Date() } }
        });
        if (isBlocked) return res.status(403).json({ message: 'Device blocked. Try again later.' });

        // التحقق من صحة وصلاحية الـ OTP
        if (user.otp !== String(otp) || new Date() > user.otpExpires) {
            user.otpAttempts += 1; // زيادة عداد المحاولات الخاطئة
            await user.save();

            // إذا أخطأ المستخدم 5 مرات، يتم حظر جهازه لمدة دقيقة وإرسال إنذار للأدمن
            if (user.otpAttempts >= 5) {
                await BlockedDevice.create({
                    userId: user.id,
                    ipAddress,
                    userAgent,
                    deviceHash,
                    blockedUntil: new Date(Date.now() + 60 * 1000) // 60 ثانية من الحظر
                });
                
                const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
                
                // إنشاء روابط مشفرة للأدمن لاتخاذ إجراءات الحماية بنقرة واحدة من الإيميل
                const blockToken = jwt.sign({ action: 'block_device', deviceHash, userId: user.id }, process.env.JWT_SECRET || 'craftcode_secret', { expiresIn: '1d' });
                const unblockToken = jwt.sign({ action: 'unblock_device', deviceHash, userId: user.id }, process.env.JWT_SECRET || 'craftcode_secret', { expiresIn: '1d' });
                const logoutToken = jwt.sign({ action: 'force_logout', userId: user.id }, process.env.JWT_SECRET || 'craftcode_secret', { expiresIn: '1d' });

                await notifyAdmins('Security Alert: Device Blocked', `
                    <p>A device was blocked after 5 failed OTP attempts.</p>
                    <ul>
                        <li>User: ${user.name} (${user.email})</li>
                        <li>IP: ${ipAddress}</li>
                        <li>User Agent: ${userAgent}</li>
                    </ul>
                    <hr>
                    <h3>Admin Actions</h3>
                    <p><a href="${serverUrl}/api/security-actions/block/${blockToken}">Permanently Block Device</a></p>
                    <p><a href="${serverUrl}/api/security-actions/unblock/${unblockToken}">Unblock Device Now</a></p>
                    <p><a href="${serverUrl}/api/security-actions/logout/${logoutToken}">Force Logout User (Revoke all sessions)</a></p>
                `);
                
                return res.status(403).json({ message: 'Too many failed attempts. Device blocked for 60 seconds.' });
            }
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // إذا كان الكود صحيحاً، يتم تفعيل الحساب وتصفير الكود والعدادات
        user.isVerified = true;
        user.otp = null;
        user.otpExpires = null;
        user.otpAttempts = 0;
        await user.save();

        // توليد التوكن الخاص بجلسة الدخول
        const { accessToken, refreshTokenString } = await generateTokens(user);

        // حفظ التوكن في ملفات تعريف الارتباط (Cookies) بدلاً من الـ LocalStorage لحمايتها من ثغرات XSS
        res.cookie('refreshToken', refreshTokenString, {
            httpOnly: true, // يمنع قراءة الكوكي بواسطة الجافاسكريبت
            secure: process.env.NODE_ENV === 'production', // يعمل فقط على HTTPS في الإنتاج
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, message: 'Account activated successfully!', token: accessToken, role: user.role });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during verification' });
    }
};

// ─── 3. دالة إعادة إرسال كود التفعيل (Resend OTP) ───
exports.resendOTP = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    try {
        const user = await User.unscoped().findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'Email not found.' });
        if (user.isVerified) return res.status(400).json({ message: 'Account is already verified.' });

        // توليد كود جديد وتحديث الصلاحية لـ 40 ثانية
        const otp = Math.floor(100000000 + Math.random() * 900000000).toString();
        user.otp = otp;
        user.otpExpires = new Date(Date.now() + 40 * 1000);
        await user.save();

        await sendEmail({
            email: user.email,
            subject: 'Craft Code - New Verification Code',
            message: `<h1>Your New Verification Code</h1><h2 style="font-family: Courier, monospace; letter-spacing: 5px;">${otp}</h2><p>This code is valid for 40 seconds.</p>`,
        });

        res.status(200).json({ success: true, message: `A new verification code has been sent.` });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// ─── 4. دالة تسجيل الدخول (Login) ───
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required.' });

    try {
        const user = await User.unscoped().findOne({ where: { email } });
        if (!user) return res.status(404).json({ message: 'Email not registered' });
        // منع تسجيل الدخول إذا لم يتم التحقق من الحساب مسبقاً عبر الإيميل
        if (!user.isVerified) return res.status(403).json({ message: 'Please verify your account with OTP first' });

        // مقارنة كلمة المرور المُدخلة مع المشفرة في قاعدة البيانات
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect password' });

        // توليد مفاتيح الدخول وحفظها في الـ Cookies
        const { accessToken, refreshTokenString } = await generateTokens(user);

        res.cookie('refreshToken', refreshTokenString, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, message: 'Logged in successfully', token: accessToken, role: user.role });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred during login' });
    }
};

// ─── 5. دالة تسجيل الخروج (Logout) ───
exports.logoutUser = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (token) {
            // إبطال مفعول الـ Refresh Token في قاعدة البيانات لمنع استخدامه مجدداً
            await RefreshToken.update({ revoked: true }, { where: { token } });
        }
        // مسح الـ Cookies من المتصفح
        res.clearCookie('refreshToken');
        res.clearCookie('accessToken');
        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during logout' });
    }
};

// ─── 6. دالة استرجاع بيانات المستخدم الحالي (Get Me) ───
exports.getMe = async (req, res) => {
    // إرجاع بيانات المستخدم (req.user يتم جلبه بواسطة ميدل وير الحماية protect)
    res.status(200).json({ success: true, data: req.user });
};

// ─── 7. دالة تجديد الـ Access Token ───
// هذه الدالة تعمل بالخلفية بدون إزعاج المستخدم لتجديد مفتاح دخوله متى ما انتهى
exports.refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'No refresh token provided' });

    try {
        // التحقق من صحة التوكن وعدم إبطاله أو انتهاء صلاحيته
        const storedToken = await RefreshToken.findOne({ where: { token } });
        if (!storedToken || storedToken.revoked || new Date() > storedToken.expiresAt) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        const user = await User.findByPk(storedToken.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { accessToken, refreshTokenString } = await generateTokens(user);

        // تدوير التوكن: إبطال القديم وحفظ الجديد لزيادة الأمان
        storedToken.revoked = true;
        await storedToken.save();

        res.cookie('refreshToken', refreshTokenString, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({ success: true, token: accessToken, role: user.role });
    } catch (error) {
        console.error('Refresh Token Error:', error);
        res.status(500).json({ message: 'Server error during token refresh' });
    }
};

// ─── 8. دالة مسح الحساب نهائياً ───
exports.deleteMe = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        await user.destroy(); // يحذف المستخدم من قاعدة البيانات
        res.status(200).json({ success: true, message: 'Your account has been successfully deleted.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while deleting account.' });
    }
};

// ─── 9. دالة تحديث بيانات الملف الشخصي ───
exports.updateDetails = async (req, res) => {
    try {
        const { name, bio, phone, email } = req.body;
        const user = await User.findByPk(req.user.id);
        if (user) {
            if (name) user.name = name;
            if (bio !== undefined) user.bio = bio; // تم استخدام !== undefined للسماح بإرسال نبذة فارغة
            if (phone) user.phone = phone;
            if (email) user.email = email;
            await user.save();
            res.status(200).json({ success: true, data: user });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating details.' });
    }
};

// ─── 10. دالة تغيير كلمة المرور ───
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Current and new passwords are required.' });
        if (newPassword.length < 6) return res.status(400).json({ message: 'New password must be at least 6 characters.' });

        const user = await User.unscoped().findByPk(req.user.id);
        // التحقق من صحة كلمة المرور القديمة قبل السماح بالتغيير
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });

        user.password = newPassword;
        await user.save(); // الـ Hook في ملف User.js سيتولى تشفيرها تلقائياً
        res.status(200).json({ success: true, message: 'Password updated successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error while updating password.' });
    }
};

// دوال استعادة كلمة المرور تم تركها فارغة مؤقتاً لتوفير المساحة
exports.forgotPassword = async (req, res) => { /* منطق إرسال إيميل الاستعادة يكتب هنا */ };
exports.resetPassword = async (req, res) => { /* منطق التحقق من رمز الاستعادة وتحديث الرمز يكتب هنا */ };