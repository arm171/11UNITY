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
            db.promise().query(`SELECT COUNT(*) as count FROM match_events WHERE event_type = 'goal'`)
        ]);

        // Get top 5 scorers (across all tournaments)
        const [topScorers] = await db.promise().query(`
            SELECT
                u.id,
                u.name,
                t.name as team_name,
                t.logo_color as team_color,
                COALESCE(SUM(ps.goals), 0) as goals
            FROM users u
            LEFT JOIN team_players tp ON u.id = tp.player_id
            LEFT JOIN teams t ON tp.team_id = t.id
            LEFT JOIN player_statistics ps ON u.id = ps.player_id
            WHERE u.role = 'player'
            GROUP BY u.id, u.name, t.name, t.logo_color
            HAVING goals > 0
            ORDER BY goals DESC
            LIMIT 5
        `);

        // Get top 5 assistants (across all tournaments)
        const [topAssists] = await db.promise().query(`
            SELECT
                u.id,
                u.name,
                t.name as team_name,
                t.logo_color as team_color,
                COALESCE(SUM(ps.assists), 0) as assists
            FROM users u
            LEFT JOIN team_players tp ON u.id = tp.player_id
            LEFT JOIN teams t ON tp.team_id = t.id
            LEFT JOIN player_statistics ps ON u.id = ps.player_id
            WHERE u.role = 'player'
            GROUP BY u.id, u.name, t.name, t.logo_color
            HAVING assists > 0
            ORDER BY assists DESC
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
                topAssists
            }
        });

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics',
        });
    }
});

/**
 * Get tournament-specific statistics
 * GET /api/statistics/tournament/:id
 * Returns: standings + top 5 scorers + top 5 assists
 */
router.get('/tournament/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get tournament info
        const [tournament] = await db.promise().query(
            'SELECT id, name, type, status FROM tournaments WHERE id = ?',
            [id]
        );

        if (tournament.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tournament not found'
            });
        }

        // Get standings (sorted with tiebreaker)
        const [standings] = await db.promise().query(`
            SELECT
                s.*,
                t.name as team_name,
                t.logo as team_logo,
                t.logo_color as team_color
            FROM standings s
            INNER JOIN teams t ON s.team_id = t.id
            WHERE s.tournament_id = ?
            ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC, t.name ASC
        `, [id]);

        // Get top 5 scorers for this tournament
        const [topScorers] = await db.promise().query(`
            SELECT
                ps.player_id as id,
                u.name,
                t.name as team_name,
                t.logo_color as team_color,
                ps.goals
            FROM player_statistics ps
            INNER JOIN users u ON ps.player_id = u.id
            INNER JOIN teams t ON ps.team_id = t.id
            WHERE ps.tournament_id = ? AND ps.goals > 0
            ORDER BY ps.goals DESC
            LIMIT 5
        `, [id]);

        // Get top 5 assists for this tournament
        const [topAssists] = await db.promise().query(`
            SELECT
                ps.player_id as id,
                u.name,
                t.name as team_name,
                t.logo_color as team_color,
                ps.assists
            FROM player_statistics ps
            INNER JOIN users u ON ps.player_id = u.id
            INNER JOIN teams t ON ps.team_id = t.id
            WHERE ps.tournament_id = ? AND ps.assists > 0
            ORDER BY ps.assists DESC
            LIMIT 5
        `, [id]);

        res.json({
            success: true,
            tournament: tournament[0],
            standings,
            topScorers,
            topAssists
        });

    } catch (error) {
        console.error('Get tournament statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tournament statistics',
        });
    }
});

/**
 * Get list of tournaments for dropdown selector
 * GET /api/statistics/tournaments
 */
router.get('/tournaments', async (req, res) => {
    try {
        const [tournaments] = await db.promise().query(`
            SELECT id, name, type, category, status
            FROM tournaments
            ORDER BY
                CASE WHEN status = 'active' THEN 0 WHEN status = 'upcoming' THEN 1 ELSE 2 END,
                created_at DESC
        `);

        res.json({ success: true, tournaments });

    } catch (error) {
        console.error('Get tournaments list error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tournaments',
        });
    }
});

module.exports = router;
