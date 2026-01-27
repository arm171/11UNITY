// ============================================
// STATISTICS ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * Get global site statistics
 * GET /api/statistics
 */
router.get('/', async (req, res) => {
    try {
        // Get all counts in parallel
        const [
            [tournamentsResult],
            [teamsResult],
            [matchesResult],
            [playersResult],
            [goalsResult]
        ] = await Promise.all([
            db.promise().query('SELECT COUNT(*) as count FROM tournaments'),
            db.promise().query('SELECT COUNT(*) as count FROM teams'),
            db.promise().query('SELECT COUNT(*) as count FROM matches'),
            db.promise().query('SELECT COUNT(*) as count FROM users WHERE role = "player"'),
            db.promise().query('SELECT COALESCE(SUM(home_score + away_score), 0) as count FROM matches WHERE status = "finished"')
        ]);

        // Get top scorers (top 5)
        const [topScorers] = await db.promise().query(`
            SELECT
                u.id,
                u.name,
                t.name as team_name,
                t.logo_color as team_color,
                COALESCE(SUM(ps.goals), 0) as goals
            FROM users u
            LEFT JOIN team_players tp ON u.id = tp.user_id
            LEFT JOIN teams t ON tp.team_id = t.id
            LEFT JOIN player_statistics ps ON u.id = ps.player_id
            WHERE u.role = 'player'
            GROUP BY u.id, u.name, t.name, t.logo_color
            HAVING goals > 0
            ORDER BY goals DESC
            LIMIT 5
        `);

        // Get top teams by wins
        const [topTeams] = await db.promise().query(`
            SELECT
                t.id,
                t.name,
                t.logo,
                t.logo_color,
                COALESCE(SUM(s.wins), 0) as wins,
                COALESCE(SUM(s.played), 0) as played
            FROM teams t
            LEFT JOIN standings s ON t.id = s.team_id
            GROUP BY t.id, t.name, t.logo, t.logo_color
            HAVING played > 0
            ORDER BY wins DESC, played ASC
            LIMIT 5
        `);

        res.json({
            success: true,
            statistics: {
                tournaments: tournamentsResult[0].count,
                teams: teamsResult[0].count,
                matches: matchesResult[0].count,
                players: playersResult[0].count,
                goals: goalsResult[0].count,
                topScorers,
                topTeams
            }
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
            error: error.message
        });
    }
});

module.exports = router;
