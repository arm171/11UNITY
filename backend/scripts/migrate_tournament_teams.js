/**
 * Migration: add status column to tournament_teams
 * Run: node backend/scripts/migrate_tournament_teams.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

async function migrate() {
    try {
        // Check if column already exists
        const [cols] = await db.promise().query(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'tournament_teams'
              AND COLUMN_NAME = 'status'
        `);

        if (cols.length > 0) {
            console.log('Column status already exists in tournament_teams — skipping');
        } else {
            await db.promise().query(`
                ALTER TABLE tournament_teams
                ADD COLUMN status ENUM('pending','approved') NOT NULL DEFAULT 'approved'
            `);
            console.log('Added status column to tournament_teams');
        }

        // Set all existing rows to approved (they were joined before approval system)
        await db.promise().query(`
            UPDATE tournament_teams SET status = 'approved' WHERE status != 'approved'
        `);
        console.log('All existing tournament_teams rows set to approved');

        console.log('Migration complete');
        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();
