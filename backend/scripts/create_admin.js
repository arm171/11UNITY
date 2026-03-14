/**
 * Create admin user
 * Run once: node scripts/create_admin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function createAdmin() {
    try {
        // Add 'admin' to role ENUM if needed
        try {
            await db.promise().query(`ALTER TABLE users MODIFY COLUMN role ENUM('player','coach','organizer','admin') NOT NULL`);
            console.log('Role ENUM updated to include admin');
        } catch (e) {
            console.log('Role ENUM already has admin or error:', e.message);
        }

        const [existing] = await db.promise().query(`SELECT id FROM users WHERE email = 'admin@11unity.com'`);
        if (existing.length > 0) {
            console.log('Admin already exists');
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        await db.promise().query(
            `INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, 'admin', 1)`,
            ['Administrator', 'admin@11unity.com', hashedPassword]
        );

        console.log('Admin created!');
        console.log('Email: admin@11unity.com');
        console.log('Password: admin123');
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        process.exit(0);
    }
}

createAdmin();
