/**
 * Migration: Add status column to tournament_teams
 * Run: node backend/scripts/migrate_tournament_teams_status.js
 */
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
            console.log('Column status already exists in tournament_teams.');
        } else {
            await db.promise().query(`
                ALTER TABLE tournament_teams
                ADD COLUMN status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending'
                AFTER team_id
            `);
            console.log('Added status column to tournament_teams.');
        }

        // Show current data
        const [rows] = await db.promise().query(
            'SELECT tournament_id, team_id, status FROM tournament_teams'
        );
        console.log('Current tournament_teams rows:', rows);

        process.exit(0);
    } catch (err) {
        console.error('Migration error:', err);
        process.exit(1);
    }
}

migrate();
