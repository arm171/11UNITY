/**
 * Migration: Add bracket_slot column and change round to VARCHAR
 * Run once: node scripts/migrate_playoff.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

async function migrate() {
    try {
        // 1. Change round column to VARCHAR(20) to support group labels like 'Group A'
        await db.promise().query(`
            ALTER TABLE matches MODIFY COLUMN round VARCHAR(20) NOT NULL DEFAULT '1'
        `);
        console.log('✓ round column changed to VARCHAR(20)');

        // 2. Add bracket_slot column (nullable, only used in playoff)
        const [cols] = await db.promise().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'matches' AND COLUMN_NAME = 'bracket_slot'
        `);
        if (cols.length === 0) {
            await db.promise().query(`
                ALTER TABLE matches ADD COLUMN bracket_slot INT NULL DEFAULT NULL
            `);
            console.log('✓ bracket_slot column added');
        } else {
            console.log('✓ bracket_slot column already exists');
        }

        console.log('\nMigration complete!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err.message);
        process.exit(1);
    }
}

migrate();
