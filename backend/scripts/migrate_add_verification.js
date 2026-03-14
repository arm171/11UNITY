/**
 * Migration: Add email verification fields to users table
 * Run once: node scripts/migrate_add_verification.js
 */

require('dotenv').config();
const db = require('../config/database');

async function migrate() {
    try {
        // Check existing columns
        const [cols] = await db.promise().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
        `, [process.env.DB_NAME]);

        const existingCols = cols.map(c => c.COLUMN_NAME);

        if (!existingCols.includes('is_verified')) {
            await db.promise().query(`ALTER TABLE users ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0`);
            console.log('Added: is_verified');
        } else {
            console.log('Skip: is_verified already exists');
        }

        if (!existingCols.includes('verification_token')) {
            await db.promise().query(`ALTER TABLE users ADD COLUMN verification_token VARCHAR(64) NULL`);
            console.log('Added: verification_token');
        } else {
            console.log('Skip: verification_token already exists');
        }

        // Also add admin role if needed - make existing users verified
        await db.promise().query(`UPDATE users SET is_verified = 1 WHERE is_verified = 0`);
        console.log('Existing users marked as verified');

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration error:', error.message);
    } finally {
        process.exit(0);
    }
}

migrate();
