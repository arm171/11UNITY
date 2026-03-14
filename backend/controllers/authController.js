/**
 * AUTH CONTROLLER
 * Handles user registration, email verification, and login.
 *
 * Registration flow:
 *   1. User submits form → account created with is_verified = 0
 *   2. Verification email sent with unique token
 *   3. User clicks link → /api/auth/verify/:token
 *   4. Token matched → is_verified = 1, JWT issued, user redirected to site (auto-login)
 *   5. Login blocked for unverified accounts
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { sendVerificationEmail } = require('../services/emailService');

// ─── REGISTER ────────────────────────────────────────────────────────────────

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Validate all fields are present
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Invalid email format' });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
        }

        // Validate role
        const validRoles = ['player', 'coach', 'organizer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        // Check if email is already taken
        const [existing] = await db.promise().query(
            'SELECT id FROM users WHERE email = ?', [email]
        );
        if (existing.length > 0) {
            return res.status(409).json({ success: false, message: 'User with this email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate unique verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Save user as unverified
        await db.promise().query(
            'INSERT INTO users (name, email, password, role, is_verified, verification_token) VALUES (?, ?, ?, ?, 0, ?)',
            [name, email, hashedPassword, role, verificationToken]
        );

        // Send verification email (non-blocking — registration succeeds even if email fails)
        sendVerificationEmail(email, name, verificationToken).catch(err => {
            console.error('Failed to send verification email:', err.message);
        });

        console.log(`User registered (pending verification): ${email} (${role})`);

        res.status(201).json({
            success: true,
            message: 'Registration successful! Please check your email to verify your account.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Registration failed' });
    }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────

const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;

        // Find unverified user with this token
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE verification_token = ? AND is_verified = 0',
            [token]
        );

        if (users.length === 0) {
            // Token is invalid or already used
            return res.status(400).send(`
                <!DOCTYPE html>
                <html>
                <head><meta charset="UTF-8"><title>11UNITY - Invalid Link</title></head>
                <body style="font-family:Arial,sans-serif;text-align:center;padding:80px;background:#1a1a2e;color:#fff;">
                    <h1 style="color:#e74c3c;">Invalid or expired link</h1>
                    <p style="color:#aaa;">This verification link has already been used or does not exist.</p>
                    <a href="http://localhost:5500" style="color:#2ecc71;">Go to 11UNITY</a>
                </body>
                </html>
            `);
        }

        const user = users[0];

        // Mark user as verified and clear the token
        await db.promise().query(
            'UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?',
            [user.id]
        );

        // Issue JWT so the user is automatically logged in
        const jwtToken = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Build user payload for frontend localStorage
        const userData = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            created_at: user.created_at
        };

        const userJson = encodeURIComponent(JSON.stringify(userData));

        console.log(`Email verified and auto-login issued: ${user.email}`);

        // Redirect to frontend with token — frontend will auto-login the user
        res.redirect(`http://127.0.0.1:5500/frontend/index.html?auth_token=${jwtToken}&auth_user=${userJson}`);

    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).send('Verification failed');
    }
};

// ─── LOGIN ────────────────────────────────────────────────────────────────────

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Find user by email
        const [users] = await db.promise().query(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if (users.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const user = users[0];

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Block login if email is not verified
        if (!user.is_verified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in. Check your inbox.'
            });
        }

        // Issue JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log(`User logged in: ${email} (${user.role})`);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Login failed' });
    }
};

module.exports = { register, verifyEmail, login };
