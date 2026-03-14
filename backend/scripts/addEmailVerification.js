/**
 * DATABASE MIGRATION
 * Adds email verification columns to the users table
 * Run once: node scripts/addEmailVerification.js
 */

require('dotenv').config();
const db = require('../config/database');

async function migrate() {
    console.log('Running migration: add email verification columns...');

    try {
        // Add is_verified column (0 = not verified, 1 = verified)
        await db.promise().query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS is_verified TINYINT(1) NOT NULL DEFAULT 0
        `);
        console.log('✓ Column is_verified added');

        // Add verification_token column (random 64-char hex string)
        await db.promise().query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS verification_token VARCHAR(128) DEFAULT NULL
        `);
        console.log('✓ Column verification_token added');

        // Mark all existing users as verified so they can still login
        await db.promise().query(`
            UPDATE users SET is_verified = 1 WHERE is_verified = 0 AND verification_token IS NULL
        `);
        console.log('✓ Existing users marked as verified');

        console.log('\nMigration complete!');
    } catch (error) {
        console.error('Migration failed:', error.message);
    } finally {
        process.exit();
    }
}

migrate();
