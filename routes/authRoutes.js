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

// --- Avatar Upload Middleware ---
const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });

const avatarStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, avatarDir),
    filename: (req, file, cb) => {
        // req.user.id is safe here because protect runs before this middleware
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
    limits: { fileSize: 2 * 1024 * 1024 } // 2 MB max
});

// @route  POST /api/auth/register
// @desc   Register a new user and send OTP
router.post('/register', registerUser);

// @route  POST /api/auth/verify
// @desc   Verify user's OTP
router.post('/verify', verifyOTP);

// @route  POST /api/auth/resend-otp
// @desc   Resend OTP to unverified user
router.post('/resend-otp', resendOTP);

// @route  POST /api/auth/login
// @desc   Login a user
router.post('/login', loginUser);

// @route  POST /api/auth/logout
// @desc   Logout a user and invalidate refresh token
router.post('/logout', logoutUser);

// @route  POST /api/auth/refresh
// @desc   Get new access token from refresh token
router.post('/refresh', refreshToken);

// @route  GET /api/auth/me
// @desc   Get logged in user data
router.get('/me', protect, getMe);

// @route  PUT /api/auth/me/photo
// @desc   Upload user profile picture (protect runs first, then multer — req.user.id is safe)
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

// @route  DELETE /api/auth/me
// @desc   Delete logged in user account
router.delete('/me', protect, deleteMe);

// @route  PUT /api/auth/me/details
// @desc   Update user details (name)
router.put('/me/details', protect, updateDetails);

// @route  PUT /api/auth/me/password
// @desc   Update user password
router.put('/me/password', protect, updatePassword);

// @route  POST /api/auth/forgotpassword
// @desc   Forgot password
router.post('/forgotpassword', forgotPassword);

// @route  PUT /api/auth/resetpassword/:token
// @desc   Reset password
router.put('/resetpassword/:token', resetPassword);

module.exports = router;