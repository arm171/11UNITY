const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

            // 2. Personal stats — sum across all tournaments from player_statistics
            const [stats] = await db.promise().query(`
                SELECT
                    COALESCE(SUM(ps.goals), 0)   as goals,
                    COALESCE(SUM(ps.assists), 0) as assists
                FROM player_statistics ps
                WHERE ps.player_id = ?
            `, [userId]);

            // Cards still come from match_events (0 if no live matches recorded)
            const [cardStats] = await db.promise().query(`
                SELECT
                    COALESCE(SUM(CASE WHEN me.event_type = 'yellow_card' THEN 1 ELSE 0 END), 0) as yellow_cards,
                    COALESCE(SUM(CASE WHEN me.event_type = 'red_card'    THEN 1 ELSE 0 END), 0) as red_cards
                FROM match_events me
                WHERE me.player_id = ?
            `, [userId]);

            const playerStats = {
                goals: stats[0].goals,
                assists: stats[0].assists,
                yellow_cards: cardStats[0].yellow_cards,
                red_cards: cardStats[0].red_cards
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

                // 4. Tournament participation (only approved)
                const [tournamentData] = await db.promise().query(`
                    SELECT tn.id, tn.name, tn.status, tn.type, tn.category
                    FROM tournament_teams tt
                    INNER JOIN tournaments tn ON tt.tournament_id = tn.id
                    WHERE tt.team_id = ? AND tt.status = 'approved'
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

        } else if (role === 'admin') {
            // Admin: return system-wide counts
            const [[users], [teams], [tournaments], [matches]] = await Promise.all([
                db.promise().query('SELECT COUNT(*) as count FROM users WHERE role != "admin"'),
                db.promise().query('SELECT COUNT(*) as count FROM teams'),
                db.promise().query('SELECT COUNT(*) as count FROM tournaments'),
                db.promise().query('SELECT COUNT(*) as count FROM matches')
            ]);

            res.json({
                success: true,
                role: 'admin',
                stats: {
                    users: users[0].count,
                    teams: teams[0].count,
                    tournaments: tournaments[0].count,
                    matches: matches[0].count
                }
            });

        } else if (role === 'organizer') {
            // Tournaments with team counts
            const [tournaments] = await db.promise().query(`
                SELECT t.*, COUNT(DISTINCT tt.team_id) as teams_count
                FROM tournaments t
                LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id AND tt.status = 'approved'
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

// PUT /api/profile/update - Update user profile
router.put('/update', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, currentPassword, newPassword } = req.body;

        // Get current user data
        const [users] = await db.promise().query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const user = users[0];

        // If changing password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ success: false, message: 'Current password is required' });
            }
            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return res.status(400).json({ success: false, message: 'Current password is incorrect' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
            }
        }

        // If changing email, check uniqueness
        if (email && email !== user.email) {
            const [emailCheck] = await db.promise().query('SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]);
            if (emailCheck.length > 0) {
                return res.status(409).json({ success: false, message: 'Email already in use' });
            }
        }

        // Build update query
        let updateFields = [];
        let updateValues = [];

        if (name && name.trim()) {
            updateFields.push('name = ?');
            updateValues.push(name.trim());
        }
        if (email && email.trim()) {
            updateFields.push('email = ?');
            updateValues.push(email.trim());
        }
        if (newPassword) {
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        const emailChanged = email && email.trim() !== user.email;

        updateValues.push(userId);
        await db.promise().query(`UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`, updateValues);

        // Return updated user data (for frontend to update localStorage)
        const [updatedUser] = await db.promise().query('SELECT id, name, email, role FROM users WHERE id = ?', [userId]);

        // If email changed, issue a new JWT with the updated email
        let newToken = null;
        if (emailChanged) {
            newToken = jwt.sign(
                { id: updatedUser[0].id, email: updatedUser[0].email, role: updatedUser[0].role },
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
        }

        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: updatedUser[0],
            ...(newToken && { token: newToken })
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
});

module.exports = router;
