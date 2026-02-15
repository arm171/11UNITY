/**
 * AUTH MIDDLEWARE
 * JWT token verification and role-based access control
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token from request headers
 * Expects Authorization header in format: "Bearer <token>"
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token is required'
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

/**
 * Check if user has required role
 * Returns middleware function that validates user role
 *
 * @param {Array<string>} roles - Array of allowed roles
 * @returns {Function} Express middleware function
 */
const checkRole = (roles) => {
    const rolesArray = Array.isArray(roles) ? roles : [roles];
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized'
            });
        }

        if (!rolesArray.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${rolesArray.join(' or ')}`
            });
        }

        next();
    };
};

module.exports = {
    verifyToken,
    checkRole
};