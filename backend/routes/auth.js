const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// Limit login attempts: max 5 per minute per IP (brute-force protection)
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many login attempts. Please try again in 1 minute.' },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/register', authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/verify/:token', authController.verifyEmail);

module.exports = router;
