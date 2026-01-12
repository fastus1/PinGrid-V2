const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('./auth.controller');
const authMiddleware = require('../../shared/middleware/auth.middleware');

const router = express.Router();

// ==============================
// SECURITY: Rate Limiting
// ==============================

// Login: 5 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        error: 'Too many login attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Register: 3 attempts per 15 minutes per IP (more strict)
const registerLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3,
    message: {
        success: false,
        error: 'Too many registration attempts. Please try again in 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// ==============================
// Public routes
// ==============================
router.post('/register', registerLimiter, authController.register.bind(authController));
router.post('/login', loginLimiter, authController.login.bind(authController));

// ==============================
// Protected routes (require authentication)
// ==============================
router.get('/me', authMiddleware, authController.getMe.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));

module.exports = router;
