/**
 * CREATE ADMIN USER
 * Run once to create the admin account in the database.
 * Usage: node scripts/createAdmin.js
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function createAdmin() {
    const email    = 'admin@11unity.com';
    const password = 'admin123';
    const name     = 'Admin';

    try {
        // Check if admin already exists
        const [existing] = await db.promise().query(
            'SELECT id FROM users WHERE email = ?', [email]
        );

        if (existing.length > 0) {
            console.log('Admin already exists:', email);
            process.exit();
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.promise().query(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
            [name, email, hashedPassword, 'admin']
        );

        console.log('✓ Admin account created!');
        console.log('  Email   :', email);
        console.log('  Password:', password);

    } catch (error) {
        console.error('Error creating admin:', error.message);
    } finally {
        process.exit();
    }
}

createAdmin();
