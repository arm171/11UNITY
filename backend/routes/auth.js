/* ==============================================
   AUTH ROUTES - Маршруты авторизации
   ============================================== */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/register - Регистрация нового пользователя
router.post('/register', authController.register);

// POST /api/auth/login - Вход пользователя
router.post('/login', authController.login);

module.exports = router;