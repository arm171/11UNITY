// ============================================
// TEAM CONTROLLER
// Handles team management operations
// ============================================

const db = require('../config/database');

/**
 * Check if a team is in an active tournament
 * @param {number} teamId
 * @returns {Promise<boolean>}
 */
const isTeamInActiveTournament = async (teamId) => {
    const [rows] = await db.promise().query(
        `SELECT tt.id FROM tournament_teams tt
         INNER JOIN tournaments t ON tt.tournament_id = t.id
         WHERE tt.team_id = ? AND t.status = 'active'`,
        [teamId]
    );
    return rows.length > 0;
};

// Get all teams
const getTeams = async (req, res) => {
    try {
        const query = `
            SELECT
                t.*,
                u.name as coach_name,
                COUNT(DISTINCT tp.player_id) as players_count,
                tn.name as tournament_name,
                tn.id as tournament_id
            FROM teams t
            LEFT JOIN users u ON t.coach_id = u.id
            LEFT JOIN team_players tp ON t.id = tp.team_id
            LEFT JOIN tournament_teams tt ON t.id = tt.team_id
            LEFT JOIN tournaments tn ON tt.tournament_id = tn.id AND tn.status IN ('upcoming', 'active')
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `;
        const [teams] = await db.promise().query(query);
        res.json({ success: true, teams });
    } catch (error) {
        console.error('Get teams error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message
        });
    }
};

// Get team by ID
const getTeamById = async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT
                t.*,
                u.name as coach_name,
                COUNT(DISTINCT tp.player_id) as players_count,
                tn.name as tournament_name,
                tn.id as tournament_id,
                tn.status as tournament_status
            FROM teams t
            LEFT JOIN users u ON t.coach_id = u.id
            LEFT JOIN team_players tp ON t.id = tp.team_id
            LEFT JOIN tournament_teams tt ON t.id = tt.team_id
            LEFT JOIN tournaments tn ON tt.tournament_id = tn.id AND tn.status IN ('upcoming', 'active')
            WHERE t.id = ?
            GROUP BY t.id
        `;
        const [teams] = await db.promise().query(query, [id]);

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        // Get players (without email)
        const [players] = await db.promise().query(
            `SELECT
                tp.id as team_player_id,
                tp.player_id,
                tp.position,
                tp.jersey_number,
                u.name as player_name
            FROM team_players tp
            LEFT JOIN users u ON tp.player_id = u.id
            WHERE tp.team_id = ?
            ORDER BY tp.jersey_number`,
            [id]
        );

        // Get team stats from standings (all tournaments)
        const [stats] = await db.promise().query(
            `SELECT
                COALESCE(SUM(s.played), 0) as total_matches,
                COALESCE(SUM(s.won), 0) as total_wins,
                COALESCE(SUM(s.drawn), 0) as total_draws,
                COALESCE(SUM(s.lost), 0) as total_losses,
                COALESCE(SUM(s.goals_for), 0) as total_goals_for,
                COALESCE(SUM(s.goals_against), 0) as total_goals_against
            FROM standings s
            WHERE s.team_id = ?`,
            [id]
        );

        const team = teams[0];
        team.players = players;
        team.stats = stats[0];
        res.json({ success: true, team });
    } catch (error) {
        console.error('Get team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team',
            error: error.message
        });
    }
};

// Create team
const createTeam = async (req, res) => {
    try {
        const { name, logoColor, description } = req.body;
        const coachId = req.user.id;

        // Validate name
        if (!name || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Team name must be between 3 and 100 characters'
            });
        }

        // Check coach already has a team
        const [existingTeams] = await db.promise().query(
            'SELECT id FROM teams WHERE coach_id = ?',
            [coachId]
        );

        if (existingTeams.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You already have a team'
            });
        }

        // Check unique team name
        const [nameCheck] = await db.promise().query(
            'SELECT id FROM teams WHERE LOWER(name) = LOWER(?)',
            [name.trim()]
        );

        if (nameCheck.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A team with this name already exists'
            });
        }

        // Auto-generate logo from first 2 letters
        const logo = name.trim().substring(0, 2).toUpperCase();

        const [result] = await db.promise().query(
            `INSERT INTO teams (name, logo, logo_color, description, max_players, coach_id)
            VALUES (?, ?, ?, ?, 25, ?)`,
            [name.trim(), logo, logoColor || '#2ecc71', description || null, coachId]
        );

        const teamId = result.insertId;
        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            team: {
                id: teamId,
                name: name.trim(),
                logo,
                logo_color: logoColor || '#2ecc71',
                description,
                max_players: 25,
                coach_id: coachId
            }
        });
    } catch (error) {
        console.error('Create team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create team',
            error: error.message
        });
    }
};

// Update team
const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logoColor, description } = req.body;
        const userId = req.user.id;

        const [teams] = await db.promise().query(
            'SELECT coach_id FROM teams WHERE id = ?',
            [id]
        );

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        if (teams[0].coach_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the coach can update this team'
            });
        }

        // Block edit during active tournament
        if (await isTeamInActiveTournament(id)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot edit team while in an active tournament'
            });
        }

        // Validate name
        if (!name || name.trim().length < 3 || name.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: 'Team name must be between 3 and 100 characters'
            });
        }

        // Check unique name (exclude current team)
        const [nameCheck] = await db.promise().query(
            'SELECT id FROM teams WHERE LOWER(name) = LOWER(?) AND id != ?',
            [name.trim(), id]
        );

        if (nameCheck.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A team with this name already exists'
            });
        }

        // Auto-generate logo from first 2 letters
        const logo = name.trim().substring(0, 2).toUpperCase();

        await db.promise().query(
            `UPDATE teams SET name = ?, logo = ?, logo_color = ?, description = ? WHERE id = ?`,
            [name.trim(), logo, logoColor, description, id]
        );

        res.json({
            success: true,
            message: 'Team updated successfully'
        });
    } catch (error) {
        console.error('Update team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update team',
            error: error.message
        });
    }
};

// Delete team
const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [teams] = await db.promise().query(
            'SELECT coach_id FROM teams WHERE id = ?',
            [id]
        );

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        if (teams[0].coach_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the coach can delete this team'
            });
        }

        // Check: must have 0 players
        const [playerCount] = await db.promise().query(
            'SELECT COUNT(*) as count FROM team_players WHERE team_id = ?',
            [id]
        );

        if (playerCount[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete team with players. Remove all players first.'
            });
        }

        // Check: must not be in any tournament
        const [tournamentCount] = await db.promise().query(
            'SELECT COUNT(*) as count FROM tournament_teams WHERE team_id = ?',
            [id]
        );

        if (tournamentCount[0].count > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete team that is registered in a tournament'
            });
        }

        await db.promise().query('DELETE FROM teams WHERE id = ?', [id]);
        res.json({
            success: true,
            message: 'Team deleted successfully'
        });
    } catch (error) {
        console.error('Delete team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete team',
            error: error.message
        });
    }
};

// Search players by name or email
const searchPlayers = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Search query must be at least 2 characters'
            });
        }

        const searchTerm = `%${query.trim()}%`;

        const [players] = await db.promise().query(
            `SELECT
                u.id,
                u.name,
                u.email,
                CASE
                    WHEN tp.team_id IS NOT NULL THEN true
                    ELSE false
                END as has_team
            FROM users u
            LEFT JOIN team_players tp ON u.id = tp.player_id
            WHERE u.role = 'player' AND (u.name LIKE ? OR u.email LIKE ?)
            LIMIT 10`,
            [searchTerm, searchTerm]
        );

        res.json({ success: true, players });
    } catch (error) {
        console.error('Search players error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search players',
            error: error.message
        });
    }
};

// Add player to team
const addPlayerToTeam = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { playerId, jerseyNumber, position } = req.body;
        const coachId = req.user.id;

        if (!playerId || !jerseyNumber || !position) {
            return res.status(400).json({
                success: false,
                message: 'playerId, jerseyNumber, and position are required'
            });
        }

        const [teams] = await db.promise().query(
            'SELECT coach_id, max_players FROM teams WHERE id = ?',
            [teamId]
        );

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        if (teams[0].coach_id !== coachId) {
            return res.status(403).json({
                success: false,
                message: 'Only the coach can add players to this team'
            });
        }

        // Block during active tournament
        if (await isTeamInActiveTournament(teamId)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot add players while team is in an active tournament'
            });
        }

        const [players] = await db.promise().query(
            'SELECT id, role FROM users WHERE id = ?',
            [playerId]
        );

        if (players.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Player not found'
            });
        }

        if (players[0].role !== 'player') {
            return res.status(400).json({
                success: false,
                message: 'User is not a player'
            });
        }

        // Check player not already in another team
        const [existingTeamPlayers] = await db.promise().query(
            'SELECT team_id FROM team_players WHERE player_id = ?',
            [playerId]
        );

        if (existingTeamPlayers.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Player is already in another team'
            });
        }

        // Check team is not full
        const [currentPlayers] = await db.promise().query(
            'SELECT COUNT(*) as count FROM team_players WHERE team_id = ?',
            [teamId]
        );

        if (currentPlayers[0].count >= teams[0].max_players) {
            return res.status(400).json({
                success: false,
                message: `Team is full (max ${teams[0].max_players} players)`
            });
        }

        // Check jersey number unique
        const [existingJerseys] = await db.promise().query(
            'SELECT id FROM team_players WHERE team_id = ? AND jersey_number = ?',
            [teamId, jerseyNumber]
        );

        if (existingJerseys.length > 0) {
            return res.status(409).json({
                success: false,
                message: `Jersey number ${jerseyNumber} is already taken`
            });
        }

        if (jerseyNumber < 1 || jerseyNumber > 99) {
            return res.status(400).json({
                success: false,
                message: 'Jersey number must be between 1 and 99'
            });
        }

        const validPositions = ['goalkeeper', 'defender', 'midfielder', 'forward'];
        if (!validPositions.includes(position)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid position. Must be: goalkeeper, defender, midfielder, or forward'
            });
        }

        await db.promise().query(
            `INSERT INTO team_players (team_id, player_id, jersey_number, position)
            VALUES (?, ?, ?, ?)`,
            [teamId, playerId, jerseyNumber, position]
        );

        res.status(201).json({
            success: true,
            message: 'Player added to team successfully'
        });
    } catch (error) {
        console.error('Add player error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                success: false,
                message: 'Player is already in a team or jersey number is taken'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to add player to team',
            error: error.message
        });
    }
};

// Remove player from team
const removePlayerFromTeam = async (req, res) => {
    try {
        const { teamId, playerId } = req.params;
        const coachId = req.user.id;

        const [teams] = await db.promise().query(
            'SELECT coach_id FROM teams WHERE id = ?',
            [teamId]
        );

        if (teams.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        if (teams[0].coach_id !== coachId) {
            return res.status(403).json({
                success: false,
                message: 'Only the coach can remove players from this team'
            });
        }

        // Block during active tournament
        if (await isTeamInActiveTournament(teamId)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot remove players while team is in an active tournament'
            });
        }

        const [teamPlayers] = await db.promise().query(
            'SELECT id FROM team_players WHERE team_id = ? AND player_id = ?',
            [teamId, playerId]
        );

        if (teamPlayers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Player not found in this team'
            });
        }

        await db.promise().query(
            'DELETE FROM team_players WHERE team_id = ? AND player_id = ?',
            [teamId, playerId]
        );

        res.json({
            success: true,
            message: 'Player removed from team successfully'
        });
    } catch (error) {
        console.error('Remove player error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove player from team',
            error: error.message
        });
    }
};

// Player leaves their own team
const leaveTeam = async (req, res) => {
    try {
        const playerId = req.user.id;

        // Find player's team
        const [teamPlayers] = await db.promise().query(
            'SELECT tp.team_id FROM team_players tp WHERE tp.player_id = ?',
            [playerId]
        );

        if (teamPlayers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'You are not in any team'
            });
        }

        const teamId = teamPlayers[0].team_id;

        // Block during active tournament
        if (await isTeamInActiveTournament(teamId)) {
            return res.status(403).json({
                success: false,
                message: 'Cannot leave team while in an active tournament'
            });
        }

        await db.promise().query(
            'DELETE FROM team_players WHERE player_id = ?',
            [playerId]
        );

        res.json({
            success: true,
            message: 'You have left the team'
        });
    } catch (error) {
        console.error('Leave team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave team',
            error: error.message
        });
    }
};

module.exports = {
    getTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,
    searchPlayers,
    addPlayerToTeam,
    removePlayerFromTeam,
    leaveTeam
};
