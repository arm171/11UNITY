const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken } = require('../middleware/auth');

// GET /api/profile/stats - Get profile data based on user role
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'player') {
            // 1. Find player's team
            const [teamInfo] = await db.promise().query(`
                SELECT tp.position, tp.jersey_number, t.id as team_id, t.name as team_name,
                       t.logo, t.logo_color
                FROM team_players tp
                INNER JOIN teams t ON tp.team_id = t.id
                WHERE tp.player_id = ?
            `, [userId]);

            // 2. Personal stats from match_events (more accurate than player_statistics)
            const [stats] = await db.promise().query(`
                SELECT
                    COALESCE(SUM(CASE WHEN me.event_type = 'goal' AND me.is_own_goal = 0 THEN 1 ELSE 0 END), 0) as goals,
                    COALESCE(SUM(CASE WHEN me.event_type = 'yellow_card' THEN 1 ELSE 0 END), 0) as yellow_cards,
                    COALESCE(SUM(CASE WHEN me.event_type = 'red_card' THEN 1 ELSE 0 END), 0) as red_cards
                FROM match_events me
                WHERE me.player_id = ?
            `, [userId]);

            // 3. Assists (where this player is the assist provider)
            const [assistStats] = await db.promise().query(`
                SELECT COUNT(*) as assists
                FROM match_events me
                WHERE me.assist_player_id = ? AND me.event_type = 'goal'
            `, [userId]);

            const playerStats = {
                goals: stats[0].goals,
                assists: assistStats[0].assists,
                yellow_cards: stats[0].yellow_cards,
                red_cards: stats[0].red_cards
            };

            // 4. Recent matches (last 5)
            let recentMatches = [];
            if (teamInfo.length > 0) {
                const teamId = teamInfo[0].team_id;
                const [matches] = await db.promise().query(`
                    SELECT m.id, m.team1_id, m.team2_id, m.team1_score, m.team2_score,
                           m.match_date, m.status, m.round,
                           t1.name as team1_name, t1.logo as team1_logo,
                           t2.name as team2_name, t2.logo as team2_logo,
                           tn.name as tournament_name
                    FROM matches m
                    INNER JOIN teams t1 ON m.team1_id = t1.id
                    INNER JOIN teams t2 ON m.team2_id = t2.id
                    INNER JOIN tournaments tn ON m.tournament_id = tn.id
                    WHERE (m.team1_id = ? OR m.team2_id = ?) AND m.status = 'finished'
                    ORDER BY m.match_date DESC
                    LIMIT 5
                `, [teamId, teamId]);
                recentMatches = matches;
            }

            res.json({
                success: true,
                role: 'player',
                team: teamInfo.length > 0 ? teamInfo[0] : null,
                stats: playerStats,
                recentMatches
            });

        } else if (role === 'coach') {
            // 1. Team info with player count
            const [teams] = await db.promise().query(`
                SELECT t.*, COUNT(DISTINCT tp.player_id) as players_count
                FROM teams t
                LEFT JOIN team_players tp ON t.id = tp.team_id
                WHERE t.coach_id = ?
                GROUP BY t.id
            `, [userId]);

            const team = teams.length > 0 ? teams[0] : null;

            let record = { total_matches: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0 };
            let players = [];
            let tournaments = [];

            if (team) {
                // 2. Team record from standings
                const [recordData] = await db.promise().query(`
                    SELECT
                        COALESCE(SUM(s.played), 0) as total_matches,
                        COALESCE(SUM(s.won), 0) as wins,
                        COALESCE(SUM(s.drawn), 0) as draws,
                        COALESCE(SUM(s.lost), 0) as losses,
                        COALESCE(SUM(s.goals_for), 0) as goals_for,
                        COALESCE(SUM(s.goals_against), 0) as goals_against
                    FROM standings s WHERE s.team_id = ?
                `, [team.id]);
                record = recordData[0];

                // 3. Player roster
                const [roster] = await db.promise().query(`
                    SELECT tp.player_id, tp.position, tp.jersey_number, u.name as player_name
                    FROM team_players tp
                    INNER JOIN users u ON tp.player_id = u.id
                    WHERE tp.team_id = ?
                    ORDER BY tp.jersey_number
                `, [team.id]);
                players = roster;

                // 4. Tournament participation
                const [tournamentData] = await db.promise().query(`
                    SELECT tn.id, tn.name, tn.status, tn.type, tn.category
                    FROM tournament_teams tt
                    INNER JOIN tournaments tn ON tt.tournament_id = tn.id
                    WHERE tt.team_id = ?
                    ORDER BY tn.start_date DESC
                `, [team.id]);
                tournaments = tournamentData;
            }

            res.json({
                success: true,
                role: 'coach',
                team,
                record,
                players,
                tournaments
            });

        } else if (role === 'organizer') {
            // Tournaments with team counts
            const [tournaments] = await db.promise().query(`
                SELECT t.*, COUNT(DISTINCT tt.team_id) as teams_count
                FROM tournaments t
                LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
                WHERE t.organizer_id = ?
                GROUP BY t.id
                ORDER BY
                    CASE WHEN t.status = 'active' THEN 0 WHEN t.status = 'upcoming' THEN 1 ELSE 2 END,
                    t.created_at DESC
            `, [userId]);

            const counts = {
                total: tournaments.length,
                active: tournaments.filter(t => t.status === 'active').length,
                upcoming: tournaments.filter(t => t.status === 'upcoming').length,
                finished: tournaments.filter(t => t.status === 'finished').length
            };

            res.json({
                success: true,
                role: 'organizer',
                tournaments,
                counts
            });
        }

    } catch (error) {
        console.error('Profile stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to load profile data' });
    }
});

module.exports = router;
