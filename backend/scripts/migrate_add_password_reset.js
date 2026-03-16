/**
 * Migration: Add password reset fields to users table
 * Run once: node scripts/migrate_add_password_reset.js
 */

require('dotenv').config();
const db = require('../config/database');

async function migrate() {
    try {
        const [cols] = await db.promise().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users'
        `, [process.env.DB_NAME]);

        const existingCols = cols.map(c => c.COLUMN_NAME);

        if (!existingCols.includes('reset_token')) {
            await db.promise().query(`ALTER TABLE users ADD COLUMN reset_token VARCHAR(64) NULL`);
            console.log('Added: reset_token');
        } else {
            console.log('Skip: reset_token already exists');
        }

        if (!existingCols.includes('reset_token_expires')) {
            await db.promise().query(`ALTER TABLE users ADD COLUMN reset_token_expires DATETIME NULL`);
            console.log('Added: reset_token_expires');
        } else {
            console.log('Skip: reset_token_expires already exists');
        }

        console.log('Migration complete!');
    } catch (error) {
        console.error('Migration error:', error.message);
    } finally {
        process.exit(0);
    }
}

migrate();
