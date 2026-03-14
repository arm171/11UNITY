/**
 * ADMIN ROUTES
 * All routes require authentication + admin role.
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { verifyToken, checkRole } = require('../middleware/auth');

// Protect all admin routes
router.use(verifyToken);
router.use(checkRole(['admin']));

// ─── STATS ────────────────────────────────────────────────────────────────────

router.get('/stats', async (req, res) => {
    try {
        const [[users], [teams], [tournaments], [matches], [unverified]] = await Promise.all([
            db.promise().query('SELECT COUNT(*) as count FROM users WHERE role != "admin"'),
            db.promise().query('SELECT COUNT(*) as count FROM teams'),
            db.promise().query('SELECT COUNT(*) as count FROM tournaments'),
            db.promise().query('SELECT COUNT(*) as count FROM matches'),
            db.promise().query('SELECT COUNT(*) as count FROM users WHERE is_verified = 0')
        ]);

        res.json({
            success: true,
            stats: {
                users: users[0].count,
                teams: teams[0].count,
                tournaments: tournaments[0].count,
                matches: matches[0].count,
                unverified: unverified[0].count
            }
        });
    } catch (error) {
        console.error('Admin stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to load stats' });
    }
});

// ─── USERS ────────────────────────────────────────────────────────────────────

// GET /api/admin/users — get all users (supports ?search= and ?role= filters)
router.get('/users', async (req, res) => {
    try {
        const { search, role } = req.query;

        let sql = 'SELECT id, name, email, role, is_verified, created_at FROM users WHERE 1=1';
        const params = [];

        if (search) {
            sql += ' AND (name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        if (role && role !== 'all') {
            sql += ' AND role = ?';
            params.push(role);
        }

        sql += ' ORDER BY created_at DESC';

        const [users] = await db.promise().query(sql, params);
        res.json({ success: true, users });
    } catch (error) {
        console.error('Admin get users error:', error);
        res.status(500).json({ success: false, message: 'Failed to load users' });
    }
});

// DELETE /api/admin/users/:id — delete a user and all their data
router.delete('/users/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
        }

        const [users] = await db.promise().query('SELECT id, role FROM users WHERE id = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const user = users[0];

        // Remove player from team
        if (user.role === 'player') {
            await db.promise().query('DELETE FROM team_players WHERE player_id = ?', [id]);
        }

        // Delete coach's team and all related data
        if (user.role === 'coach') {
            const [teams] = await db.promise().query('SELECT id FROM teams WHERE coach_id = ?', [id]);
            for (const team of teams) {
                await db.promise().query('DELETE FROM team_players WHERE team_id = ?', [team.id]);
                await db.promise().query('DELETE FROM tournament_teams WHERE team_id = ?', [team.id]);
                await db.promise().query('DELETE FROM standings WHERE team_id = ?', [team.id]);
                await db.promise().query('DELETE FROM teams WHERE id = ?', [team.id]);
            }
        }

        // Delete organizer's tournaments and all related data
        if (user.role === 'organizer') {
            const [tournaments] = await db.promise().query('SELECT id FROM tournaments WHERE organizer_id = ?', [id]);
            for (const t of tournaments) {
                await db.promise().query('DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [t.id]);
                await db.promise().query('DELETE FROM player_statistics WHERE tournament_id = ?', [t.id]);
                await db.promise().query('DELETE FROM standings WHERE tournament_id = ?', [t.id]);
                await db.promise().query('DELETE FROM matches WHERE tournament_id = ?', [t.id]);
                await db.promise().query('DELETE FROM tournament_teams WHERE tournament_id = ?', [t.id]);
                await db.promise().query('DELETE FROM tournaments WHERE id = ?', [t.id]);
            }
        }

        await db.promise().query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'User deleted' });
    } catch (error) {
        console.error('Admin delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
});

// PATCH /api/admin/users/:id/verify — manually verify a user's email
router.patch('/users/:id/verify', async (req, res) => {
    try {
        const { id } = req.params;
        await db.promise().query(
            'UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?', [id]
        );
        res.json({ success: true, message: 'User verified' });
    } catch (error) {
        console.error('Admin verify user error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify user' });
    }
});

// PATCH /api/admin/users/:id/role — change a user's role
router.patch('/users/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['player', 'coach', 'organizer'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot change your own role' });
        }

        await db.promise().query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ success: true, message: 'Role updated' });
    } catch (error) {
        console.error('Admin change role error:', error);
        res.status(500).json({ success: false, message: 'Failed to change role' });
    }
});

// ─── TOURNAMENTS ──────────────────────────────────────────────────────────────

router.get('/tournaments', async (req, res) => {
    try {
        const [tournaments] = await db.promise().query(`
            SELECT t.id, t.name, t.status, t.type, t.created_at,
                   u.name AS organizer_name,
                   COUNT(DISTINCT tt.team_id) AS teams_count
            FROM tournaments t
            LEFT JOIN users u ON t.organizer_id = u.id
            LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
            GROUP BY t.id, u.name
            ORDER BY t.created_at DESC
        `);
        res.json({ success: true, tournaments });
    } catch (error) {
        console.error('Admin get tournaments error:', error);
        res.status(500).json({ success: false, message: 'Failed to load tournaments' });
    }
});

router.delete('/tournaments/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [tournaments] = await db.promise().query('SELECT id FROM tournaments WHERE id = ?', [id]);
        if (tournaments.length === 0) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }
        await db.promise().query('DELETE FROM match_events WHERE match_id IN (SELECT id FROM matches WHERE tournament_id = ?)', [id]);
        await db.promise().query('DELETE FROM player_statistics WHERE tournament_id = ?', [id]);
        await db.promise().query('DELETE FROM standings WHERE tournament_id = ?', [id]);
        await db.promise().query('DELETE FROM matches WHERE tournament_id = ?', [id]);
        await db.promise().query('DELETE FROM tournament_teams WHERE tournament_id = ?', [id]);
        await db.promise().query('DELETE FROM tournaments WHERE id = ?', [id]);
        res.json({ success: true, message: 'Tournament deleted' });
    } catch (error) {
        console.error('Admin delete tournament error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete tournament' });
    }
});

// ─── TEAMS ────────────────────────────────────────────────────────────────────

router.get('/teams', async (req, res) => {
    try {
        const [teams] = await db.promise().query(`
            SELECT t.id, t.name, t.created_at,
                   u.name AS coach_name, u.email AS coach_email,
                   COUNT(DISTINCT tp.player_id) AS players_count
            FROM teams t
            LEFT JOIN users u ON t.coach_id = u.id
            LEFT JOIN team_players tp ON t.id = tp.team_id
            GROUP BY t.id, u.name, u.email
            ORDER BY t.created_at DESC
        `);
        res.json({ success: true, teams });
    } catch (error) {
        console.error('Admin get teams error:', error);
        res.status(500).json({ success: false, message: 'Failed to load teams' });
    }
});

router.delete('/teams/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [teams] = await db.promise().query('SELECT id FROM teams WHERE id = ?', [id]);
        if (teams.length === 0) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }
        await db.promise().query('DELETE FROM team_players WHERE team_id = ?', [id]);
        await db.promise().query('DELETE FROM tournament_teams WHERE team_id = ?', [id]);
        await db.promise().query('DELETE FROM standings WHERE team_id = ?', [id]);
        await db.promise().query('DELETE FROM teams WHERE id = ?', [id]);
        res.json({ success: true, message: 'Team deleted' });
    } catch (error) {
        console.error('Admin delete team error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete team' });
    }
});

module.exports = router;
