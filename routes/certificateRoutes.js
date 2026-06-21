const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const certificateController = require('../certificateController');

// Issue a new certificate for the logged-in user
router.post('/', protect, certificateController.issueCertificate);

// Get all certificates for the logged-in user
router.get('/me', protect, certificateController.getMyCertificates);

module.exports = router;
