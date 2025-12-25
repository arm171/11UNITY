/* ==============================================
   AUTH MIDDLEWARE - Проверка JWT токенов
   ============================================== */

const jwt = require('jsonwebtoken');

// ========== ПРОВЕРКА ТОКЕНА ==========

const verifyToken = (req, res, next) => {
    // Получаем токен из заголовка
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required'
        });
    }
    
    try {
        // Проверяем токен
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Добавляем данные пользователя в request
        req.user = decoded;
        
        next();
        
    } catch (error) {
        console.error('❌ Token verification failed:', error.message);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

// ========== ПРОВЕРКА РОЛИ ==========

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }
        
        next();
    };
};

module.exports = {
    verifyToken,
    checkRole
};