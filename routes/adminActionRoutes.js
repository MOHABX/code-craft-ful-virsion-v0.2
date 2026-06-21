const express = require('express');
const router = express.Router();
const { blockDevice, unblockDevice, forceLogout } = require('../adminActionController');

// These routes are accessed directly via email links, so they use GET instead of POST/PUT
// Authentication is handled via the JWT token in the URL parameter

router.get('/block/:token', blockDevice);
router.get('/unblock/:token', unblockDevice);
router.get('/logout/:token', forceLogout);

module.exports = router;
