const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');

// Max 5 login attempts per minute per IP
const loginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many login attempts. Please try again in 1 minute.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Max 3 registrations per hour per IP
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: { success: false, message: 'Too many registration attempts. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Max 5 password reset requests per 15 minutes per IP
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: { success: false, message: 'Too many reset attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.get('/verify/:token', authController.verifyEmail);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
