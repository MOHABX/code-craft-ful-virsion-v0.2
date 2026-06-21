const jwt = require('jsonwebtoken');
const BlockedDevice = require('./BlockedDevice');
const RefreshToken = require('./RefreshToken');
const User = require('./User');
const { Op } = require('sequelize');

exports.blockDevice = async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET || 'craftcode_secret');
        if (decoded.action !== 'block_device') return res.status(400).send('Invalid action type.');

        // Extend block time significantly (e.g. 1 year)
        await BlockedDevice.update(
            { blockedUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) },
            { where: { deviceHash: decoded.deviceHash } }
        );

        res.send('<h1>Device has been successfully blocked permanently.</h1>');
    } catch (err) {
        res.status(400).send('<h1>Invalid or Expired Token.</h1>');
    }
};

exports.unblockDevice = async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET || 'craftcode_secret');
        if (decoded.action !== 'unblock_device') return res.status(400).send('Invalid action type.');

        await BlockedDevice.destroy({ where: { deviceHash: decoded.deviceHash } });

        res.send('<h1>Device has been successfully unblocked.</h1>');
    } catch (err) {
        res.status(400).send('<h1>Invalid or Expired Token.</h1>');
    }
};

exports.forceLogout = async (req, res) => {
    try {
        const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET || 'craftcode_secret');
        if (decoded.action !== 'force_logout') return res.status(400).send('Invalid action type.');

        // Revoke all refresh tokens for this user
        await RefreshToken.update(
            { revoked: true },
            { where: { userId: decoded.userId } }
        );

        res.send('<h1>User has been forcefully logged out. All sessions revoked.</h1>');
    } catch (err) {
        res.status(400).send('<h1>Invalid or Expired Token.</h1>');
    }
};
