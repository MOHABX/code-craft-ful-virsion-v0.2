const express = require('express');
const router = express.Router();
const contactController = require('../contactController');

// Submit a contact message (from footer form)
router.post('/', contactController.submitContactMessage);

module.exports = router;
