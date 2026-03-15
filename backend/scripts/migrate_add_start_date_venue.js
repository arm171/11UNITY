/**
 * Migration: add start_date and venue columns to tournaments
 * Run: cd backend && node scripts/migrate_add_start_date_venue.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

async function migrate() {
    try {
        const [cols] = await db.promise().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'tournaments'
              AND COLUMN_NAME IN ('start_date', 'venue')
        `);

        const existing = cols.map(c => c.COLUMN_NAME);

        if (!existing.includes('start_date')) {
            await db.promise().query(`
                ALTER TABLE tournaments ADD COLUMN start_date DATE NULL AFTER status
            `);
            console.log('Added start_date column');
        } else {
            console.log('start_date already exists — skipping');
        }

        if (!existing.includes('venue')) {
            await db.promise().query(`
                ALTER TABLE tournaments ADD COLUMN venue VARCHAR(255) NULL AFTER start_date
            `);
            console.log('Added venue column');
        } else {
            console.log('venue already exists — skipping');
        }

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();
