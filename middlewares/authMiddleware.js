const jwt = require('jsonwebtoken');
const User = require('../User');

const protect = async (req, res, next) => {
    let token;

    // Check cookies first, fallback to Authorization header
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    } else if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'craftcode_secret');

            // Get user data from the database and add it to the request
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            // التأكد من أن المستخدم لم يتم حذفه من قاعدة البيانات
            if (!req.user) {
                return res.status(401).json({ message: 'Unauthorized, user no longer exists' });
            }

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Unauthorized, invalid token' });
        }
    }

    // لا يوجد token في الـ header
    return res.status(401).json({ message: 'Unauthorized, no token' });
};

module.exports = { protect };