/**
 * TOURNAMENT CONTROLLER
 * Handles all tournament-related operations
 */

const db = require('../config/database');
const tournamentSocket = require('../socket/tournamentSocket');

/**
 * Valid max_teams values by tournament type
 */
const VALID_MAX_TEAMS = {
    league: [4, 8, 12, 16, 32],
    playoff: [4, 8, 16, 32],
    group_playoff: [8, 16, 32]
};

const VALID_MIN_PLAYERS = [7, 9, 11];

/**
 * Get all tournaments with team counts
 */
const getTournaments = async (req, res) => {
    try {
        const { category } = req.query;

        let query = `
            SELECT
                t.*,
                u.name as organizer_name,
                COUNT(DISTINCT tt.team_id) as teams_count
            FROM tournaments t
            LEFT JOIN users u ON t.organizer_id = u.id
            LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
        `;

        const params = [];

        if (category && ['school', 'university', 'amateur'].includes(category)) {
            query += ' WHERE t.category = ?';
            params.push(category);
        }

        query += ' GROUP BY t.id ORDER BY t.created_at DESC';

        const [tournaments] = await db.promise().query(query, params);

        res.json({
            success: true,
            tournaments
        });

    } catch (error) {
        console.error('Get tournaments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tournaments',
        });
    }
};

/**
 * Create new tournament
 * Only organizers can create tournaments
 */
const createTournament = async (req, res) => {
    try {
        const { name, type, category, startDate, location, description, maxTeams, minPlayersPerTeam } = req.body;
        const organizerId = req.user.id;

        // Validate required fields
        if (!name || !type || !startDate || !maxTeams) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name, type, startDate, maxTeams'
            });
        }

        // Validate name length
        if (name.trim().length < 3 || name.trim().length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Tournament name must be between 3 and 255 characters'
            });
        }

        // Validate tournament type
        const validTypes = ['league', 'playoff', 'group_playoff'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tournament type'
            });
        }

        // Validate category
        const validCategories = ['school', 'university', 'amateur'];
        const tournamentCategory = category || 'amateur';
        if (!validCategories.includes(tournamentCategory)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid category'
            });
        }

        // Validate max_teams by tournament type
        if (!VALID_MAX_TEAMS[type].includes(Number(maxTeams))) {
            return res.status(400).json({
                success: false,
                message: `Invalid max_teams for ${type}. Allowed: ${VALID_MAX_TEAMS[type].join(', ')}`
            });
        }

        // Validate min_players_per_team
        const minPlayers = minPlayersPerTeam ? Number(minPlayersPerTeam) : 11;
        if (!VALID_MIN_PLAYERS.includes(minPlayers)) {
            return res.status(400).json({
                success: false,
                message: 'min_players_per_team must be 7, 9, or 11'
            });
        }

        // Validate start date is in the future
        const start = new Date(startDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        if (start < now) {
            return res.status(400).json({
                success: false,
                message: 'Start date must be in the future'
            });
        }

        // Check unique tournament name
        const [nameCheck] = await db.promise().query(
            'SELECT id FROM tournaments WHERE LOWER(name) = LOWER(?)',
            [name.trim()]
        );

        if (nameCheck.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'A tournament with this name already exists'
            });
        }

        // Check organizer has max 1 unfinished tournament
        const [unfinished] = await db.promise().query(
            `SELECT id FROM tournaments WHERE organizer_id = ? AND status IN ('upcoming', 'active')`,
            [organizerId]
        );

        if (unfinished.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'You already have an unfinished tournament. Finish it before creating a new one.'
            });
        }

        // Create tournament (always starts as 'upcoming')
        const [result] = await db.promise().query(
            `INSERT INTO tournaments
            (name, type, category, start_date, location, description, max_teams, min_players_per_team, status, organizer_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'upcoming', ?)`,
            [name.trim(), type, tournamentCategory, startDate, location || null, description || null, maxTeams, minPlayers, organizerId]
        );

        const tournamentId = result.insertId;

        console.log('Tournament created:', name, `(ID: ${tournamentId})`);

        res.status(201).json({
            success: true,
            message: 'Tournament created successfully',
            tournament: {
                id: tournamentId,
                name: name.trim(),
                type,
                category: tournamentCategory,
                start_date: startDate,
                location,
                description,
                max_teams: maxTeams,
                min_players_per_team: minPlayers,
                status: 'upcoming',
                organizer_id: organizerId
            }
        });

    } catch (error) {
        console.error('Create tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create tournament',
        });
    }
};

/**
 * Update tournament (only when status is 'upcoming')
 */
const updateTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, category, startDate, location, description, maxTeams, minPlayersPerTeam } = req.body;
        const userId = req.user.id;

        const [tournaments] = await db.promise().query(
            'SELECT organizer_id, status FROM tournaments WHERE id = ?',
            [id]
        );

        if (tournaments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tournament not found'
            });
        }

        if (tournaments[0].organizer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the organizer can update this tournament'
            });
        }

        if (tournaments[0].status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Can only edit tournaments with upcoming status'
            });
        }

        // Validate max_teams if type changed
        if (type && maxTeams && !VALID_MAX_TEAMS[type].includes(Number(maxTeams))) {
            return res.status(400).json({
                success: false,
                message: `Invalid max_teams for ${type}. Allowed: ${VALID_MAX_TEAMS[type].join(', ')}`
            });
        }

        // Check unique name (exclude self)
        if (name) {
            const [nameCheck] = await db.promise().query(
                'SELECT id FROM tournaments WHERE LOWER(name) = LOWER(?) AND id != ?',
                [name.trim(), id]
            );
            if (nameCheck.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'A tournament with this name already exists'
                });
            }
        }

        await db.promise().query(
            `UPDATE tournaments
            SET name = ?, type = ?, category = ?, start_date = ?,
                location = ?, description = ?, max_teams = ?, min_players_per_team = ?
            WHERE id = ?`,
            [
                name,
                type,
                category,
                startDate,
                location !== undefined ? location : null,
                description !== undefined ? description : null,
                maxTeams,
                minPlayersPerTeam || 11,
                id
            ]
        );

        res.json({
            success: true,
            message: 'Tournament updated successfully'
        });

    } catch (error) {
        console.error('Update tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update tournament',
        });
    }
};

/**
 * Delete tournament (only when status is 'upcoming')
 */
const deleteTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const [tournaments] = await db.promise().query(
            'SELECT organizer_id, status FROM tournaments WHERE id = ?',
            [id]
        );

        if (tournaments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tournament not found'
            });
        }

        if (tournaments[0].organizer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the organizer can delete this tournament'
            });
        }

        if (tournaments[0].status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Can only delete tournaments with upcoming status'
            });
        }

        await db.promise().query('DELETE FROM tournaments WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Tournament deleted successfully'
        });

    } catch (error) {
        console.error('Delete tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete tournament',
        });
    }
};

/**
 * Join tournament with coach's team
 */
const joinTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user.id;

        // Find coach's team
        const [teams] = await db.promise().query(
            'SELECT id FROM teams WHERE coach_id = ?',
            [userId]
        );

        if (teams.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You do not have a team. Please create a team first.'
            });
        }

        const teamId = teams[0].id;

        // Verify tournament exists and is upcoming
        const [tournaments] = await db.promise().query(
            'SELECT max_teams, status FROM tournaments WHERE id = ?',
            [tournamentId]
        );

        if (tournaments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tournament not found'
            });
        }

        if (tournaments[0].status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Can only join tournaments with upcoming status'
            });
        }

        // Check if team is already in another active/upcoming tournament
        const [existingTournament] = await db.promise().query(
            `SELECT tt.id, tn.name FROM tournament_teams tt
             INNER JOIN tournaments tn ON tt.tournament_id = tn.id
             WHERE tt.team_id = ? AND tn.status IN ('upcoming', 'active')`,
            [teamId]
        );

        if (existingTournament.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Your team is already registered in tournament: ${existingTournament[0].name}`
            });
        }

        // Check if tournament is full
        const [currentTeams] = await db.promise().query(
            'SELECT COUNT(*) as count FROM tournament_teams WHERE tournament_id = ?',
            [tournamentId]
        );

        if (currentTeams[0].count >= tournaments[0].max_teams) {
            return res.status(400).json({
                success: false,
                message: 'Tournament is full'
            });
        }

        // Join team to tournament
        await db.promise().query(
            'INSERT INTO tournament_teams (tournament_id, team_id) VALUES (?, ?)',
            [tournamentId, teamId]
        );

        res.json({
            success: true,
            message: 'Team successfully joined the tournament'
        });

    } catch (error) {
        console.error('Join tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to join tournament',
        });
    }
};

/**
 * Leave tournament (only before fixtures are generated)
 */
const leaveTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user.id;

        // Find coach's team
        const [teams] = await db.promise().query(
            'SELECT id FROM teams WHERE coach_id = ?',
            [userId]
        );

        if (teams.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'You do not have a team'
            });
        }

        const teamId = teams[0].id;

        // Verify tournament is upcoming (no fixtures)
        const [tournaments] = await db.promise().query(
            'SELECT status FROM tournaments WHERE id = ?',
            [tournamentId]
        );

        if (tournaments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tournament not found'
            });
        }

        if (tournaments[0].status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Cannot leave tournament after fixtures have been generated'
            });
        }

        // Check if team is in this tournament
        const [registration] = await db.promise().query(
            'SELECT id FROM tournament_teams WHERE tournament_id = ? AND team_id = ?',
            [tournamentId, teamId]
        );

        if (registration.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Your team is not in this tournament'
            });
        }

        await db.promise().query(
            'DELETE FROM tournament_teams WHERE tournament_id = ? AND team_id = ?',
            [tournamentId, teamId]
        );

        res.json({
            success: true,
            message: 'Your team has left the tournament'
        });

    } catch (error) {
        console.error('Leave tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to leave tournament',
        });
    }
};

/**
 * Check if user's team has joined tournament
 */
const checkUserJoined = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user.id;

        const [teams] = await db.promise().query(
            'SELECT id FROM teams WHERE coach_id = ?',
            [userId]
        );

        if (teams.length === 0) {
            return res.json({
                success: true,
                joined: false,
                hasTeam: false
            });
        }

        const teamId = teams[0].id;

        const [joined] = await db.promise().query(
            'SELECT id FROM tournament_teams WHERE tournament_id = ? AND team_id = ?',
            [tournamentId, teamId]
        );

        res.json({
            success: true,
            joined: joined.length > 0,
            hasTeam: true
        });

    } catch (error) {
        console.error('Check joined error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check join status',
        });
    }
};

/**
 * Preview fixtures before generating
 */
const previewFixtures = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const { startDate, matchDays, matchTime, matchesPerDay, daysBetweenRounds } = req.body;

        if (!startDate || !matchDays || !matchTime || !matchesPerDay) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        const fixturesGenerator = require('../helpers/fixturesGenerator');

        // Get tournament info
        const [tournamentInfo] = await db.promise().query(
            'SELECT type, min_players_per_team FROM tournaments WHERE id = ?',
            [tournamentId]
        );

        if (tournamentInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tournament not found'
            });
        }

        const [teams] = await db.promise().query(`
            SELECT t.id, t.name,
                   (SELECT COUNT(*) FROM team_players WHERE team_id = t.id) as player_count
            FROM teams t
            INNER JOIN tournament_teams tt ON t.id = tt.team_id
            WHERE tt.tournament_id = ?
        `, [tournamentId]);

        if (teams.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Minimum 2 teams required in tournament'
            });
        }

        // Check min players for each team (skip if force=true)
        const minPlayers = tournamentInfo[0].min_players_per_team;
        if (!req.body.force) {
            const teamsWithTooFewPlayers = teams.filter(t => t.player_count < minPlayers);
            if (teamsWithTooFewPlayers.length > 0) {
                const teamNames = teamsWithTooFewPlayers.map(t => `${t.name} (${t.player_count}/${minPlayers})`).join(', ');
                return res.status(400).json({
                    success: false,
                    message: `These teams don't have enough players: ${teamNames}`
                });
            }
        }

        const rounds = fixturesGenerator.generateRoundRobinDouble(teams);
        const settings = {
            startDate,
            matchDays,
            matchTime,
            matchesPerDay,
            daysBetweenRounds: daysBetweenRounds || 0
        };

        const scheduledMatches = fixturesGenerator.scheduleMatches(rounds, settings);
        const estimatedEndDate = fixturesGenerator.calculateEndDate(rounds, settings);

        const schedule = [];
        const roundsMap = {};

        scheduledMatches.forEach(match => {
            if (!roundsMap[match.round]) {
                roundsMap[match.round] = {
                    round: match.round,
                    date: match.matchDate.split(' ')[0],
                    matches: []
                };
            }

            const teamA = teams.find(t => t.id === match.teamAId);
            const teamB = teams.find(t => t.id === match.teamBId);

            roundsMap[match.round].matches.push({
                team1: teamA.name,
                team2: teamB.name
            });
        });

        Object.values(roundsMap).forEach(round => schedule.push(round));

        res.json({
            success: true,
            preview: {
                totalMatches: scheduledMatches.length,
                totalRounds: schedule.length,
                estimatedEndDate,
                schedule
            }
        });

    } catch (error) {
        console.error('Preview fixtures error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to preview fixtures'
        });
    }
};

/**
 * Generate and save fixtures to database
 * Changes tournament status to 'active'
 */
const generateFixtures = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const { startDate, matchDays, matchTime, matchesPerDay, daysBetweenRounds } = req.body;

        if (!startDate || !matchDays || !matchTime || !matchesPerDay) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Check tournament is upcoming
        const [tournamentInfo] = await db.promise().query(
            'SELECT status, min_players_per_team, organizer_id, type FROM tournaments WHERE id = ?',
            [tournamentId]
        );

        if (tournamentInfo.length === 0) {
            return res.status(404).json({ success: false, message: 'Tournament not found' });
        }

        if (tournamentInfo[0].status !== 'upcoming') {
            return res.status(400).json({
                success: false,
                message: 'Fixtures can only be generated for upcoming tournaments'
            });
        }

        if (tournamentInfo[0].organizer_id !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the organizer can generate fixtures'
            });
        }

        const [existingMatches] = await db.promise().query(
            'SELECT id FROM matches WHERE tournament_id = ?',
            [tournamentId]
        );

        if (existingMatches.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Fixtures already generated for this tournament'
            });
        }

        const fixturesGenerator = require('../helpers/fixturesGenerator');

        const [teams] = await db.promise().query(`
            SELECT t.id, t.name,
                   (SELECT COUNT(*) FROM team_players WHERE team_id = t.id) as player_count
            FROM teams t
            INNER JOIN tournament_teams tt ON t.id = tt.team_id
            WHERE tt.tournament_id = ?
        `, [tournamentId]);

        if (teams.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Minimum 2 teams required in tournament'
            });
        }

        // Check min players for each team (skip if force=true)
        const minPlayers = tournamentInfo[0].min_players_per_team;
        if (!req.body.force) {
            const teamsWithTooFewPlayers = teams.filter(t => t.player_count < minPlayers);
            if (teamsWithTooFewPlayers.length > 0) {
                const teamNames = teamsWithTooFewPlayers.map(t => `${t.name} (${t.player_count}/${minPlayers})`).join(', ');
                return res.status(400).json({
                    success: false,
                    message: `These teams don't have enough players: ${teamNames}`
                });
            }
        }

        const tournamentType = tournamentInfo[0].type;
        const settings = {
            startDate,
            matchDays,
            matchTime,
            matchesPerDay: parseInt(matchesPerDay),
            daysBetweenRounds: daysBetweenRounds || 0
        };

        // Generate matches based on tournament type
        let scheduledMatches = [];

        if (tournamentType === 'league') {
            const rounds = fixturesGenerator.generateRoundRobinDouble(teams);
            scheduledMatches = fixturesGenerator.scheduleMatches(rounds, settings);

        } else if (tournamentType === 'playoff') {
            const validSizes = [4, 8, 16, 32];
            if (!validSizes.includes(teams.length)) {
                return res.status(400).json({
                    success: false,
                    message: `Playoff requires exactly 4, 8, 16, or 32 teams. Currently: ${teams.length}`
                });
            }
            const rounds = fixturesGenerator.generatePlayoff(teams);
            scheduledMatches = fixturesGenerator.schedulePlayoffMatches(rounds, settings);

        } else if (tournamentType === 'group_playoff') {
            const validSizes = [8, 16, 32];
            if (!validSizes.includes(teams.length)) {
                return res.status(400).json({
                    success: false,
                    message: `Group+Playoff requires exactly 8, 16, or 32 teams. Currently: ${teams.length}`
                });
            }
            const { groupMatches, playoffMatches } = fixturesGenerator.generateGroupPlayoff(teams);
            scheduledMatches = fixturesGenerator.scheduleGroupPlayoffMatches(groupMatches, playoffMatches, settings);
        }

        for (const match of scheduledMatches) {
            await db.promise().query(
                `INSERT INTO matches
                (tournament_id, round, team1_id, team2_id, match_date, status, bracket_slot)
                VALUES (?, ?, ?, ?, ?, 'scheduled', ?)`,
                [tournamentId, match.round, match.teamAId, match.teamBId, match.matchDate, match.bracketSlot || null]
            );
        }

        // Initialize standings for all teams
        await initializeStandings(tournamentId);

        // Set status: 'active' only if start date has already arrived, else keep 'upcoming'
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const firstMatchDate = new Date(startDate);
        firstMatchDate.setHours(0, 0, 0, 0);

        const newStatus = firstMatchDate <= today ? 'active' : 'upcoming';
        await db.promise().query(
            `UPDATE tournaments SET status = ? WHERE id = ?`,
            [newStatus, tournamentId]
        );

        const [savedMatches] = await db.promise().query(`
            SELECT m.*,
                   t1.name as team1_name, t2.name as team2_name
            FROM matches m
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            WHERE m.tournament_id = ?
            ORDER BY m.match_date, m.id
        `, [tournamentId]);

        console.log(`Generated ${scheduledMatches.length} matches (type: ${tournamentType}, status: ${newStatus})`);

        res.json({
            success: true,
            message: `${scheduledMatches.length} matches generated successfully`,
            matches: savedMatches
        });

    } catch (error) {
        console.error('Generate fixtures error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate fixtures'
        });
    }
};

/**
 * Get all matches across all tournaments
 */
const getAllMatches = async (req, res) => {
    try {
        const { tournamentId, status } = req.query;

        let query = `
            SELECT
                m.*,
                t.name as tournament_name,
                t.type as tournament_type,
                t1.name as team1_name,
                t1.logo as team1_logo,
                t1.logo_color as team1_color,
                t2.name as team2_name,
                t2.logo as team2_logo,
                t2.logo_color as team2_color
            FROM matches m
            INNER JOIN tournaments t ON m.tournament_id = t.id
            INNER JOIN teams t1 ON m.team1_id = t1.id
            INNER JOIN teams t2 ON m.team2_id = t2.id
            WHERE 1=1
        `;

        const params = [];

        if (tournamentId) {
            query += ' AND m.tournament_id = ?';
            params.push(tournamentId);
        }

        if (status && status !== 'all') {
            if (status === 'upcoming') {
                query += ' AND m.status = ?';
                params.push('scheduled');
            } else if (status === 'finished') {
                query += ' AND m.status = ?';
                params.push('finished');
            }
        }

        // Live first, then upcoming, then finished — each group sorted by date
        query += ` ORDER BY
            CASE m.status
                WHEN 'in_progress' THEN 0
                WHEN 'scheduled'   THEN 1
                ELSE                    2
            END,
            m.match_date ASC, m.id ASC`;

        const [matches] = await db.promise().query(query, params);

        res.json({
            success: true,
            matches
        });

    } catch (error) {
        console.error('Get all matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch matches',
        });
    }
};

/**
 * Get all matches for a tournament
 */
const getTournamentMatches = async (req, res) => {
    try {
        const tournamentId = req.params.id;

        const query = `
            SELECT
                m.*,
                t.organizer_id,
                t1.name as team1_name,
                t1.logo as team1_logo,
                t1.logo_color as team1_color,
                t2.name as team2_name,
                t2.logo as team2_logo,
                t2.logo_color as team2_color
            FROM matches m
            INNER JOIN tournaments t ON m.tournament_id = t.id
            LEFT JOIN teams t1 ON m.team1_id = t1.id
            LEFT JOIN teams t2 ON m.team2_id = t2.id
            WHERE m.tournament_id = ?
            ORDER BY m.round, m.match_date
        `;

        const [matches] = await db.promise().query(query, [tournamentId]);

        res.json({
            success: true,
            matches
        });

    } catch (error) {
        console.error('Get tournament matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch matches',
        });
    }
};

/**
 * Get detailed information about a specific match
 * Includes match events with assist info
 */
const getMatchDetails = async (req, res) => {
    try {
        const { tournamentId, matchId } = req.params;

        const [matches] = await db.promise().query(`
            SELECT
                m.*,
                t.organizer_id,
                t.type as tournament_type,
                t.name as tournament_name,
                t1.name as team1_name,
                t1.logo as team1_logo,
                t1.logo_color as team1_color,
                t2.name as team2_name,
                t2.logo as team2_logo,
                t2.logo_color as team2_color
            FROM matches m
            INNER JOIN tournaments t ON m.tournament_id = t.id
            INNER JOIN teams t1 ON m.team1_id = t1.id
            INNER JOIN teams t2 ON m.team2_id = t2.id
            WHERE m.tournament_id = ? AND m.id = ?
        `, [tournamentId, matchId]);

        if (matches.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        const match = matches[0];

        // Get match events with assist player info
        const [events] = await db.promise().query(`
            SELECT
                me.*,
                u.name as player_name,
                tm.name as team_name,
                au.name as assist_player_name
            FROM match_events me
            INNER JOIN users u ON me.player_id = u.id
            INNER JOIN teams tm ON me.team_id = tm.id
            LEFT JOIN users au ON me.assist_player_id = au.id
            WHERE me.match_id = ?
            ORDER BY me.minute ASC
        `, [matchId]);

        match.events = events;

        // Get team rosters for this match (players from both teams)
        const [team1Players] = await db.promise().query(`
            SELECT tp.player_id, u.name as player_name, tp.jersey_number, tp.position
            FROM team_players tp
            INNER JOIN users u ON tp.player_id = u.id
            WHERE tp.team_id = ?
            ORDER BY tp.jersey_number
        `, [match.team1_id]);

        const [team2Players] = await db.promise().query(`
            SELECT tp.player_id, u.name as player_name, tp.jersey_number, tp.position
            FROM team_players tp
            INNER JOIN users u ON tp.player_id = u.id
            WHERE tp.team_id = ?
            ORDER BY tp.jersey_number
        `, [match.team2_id]);

        match.team1_players = team1Players;
        match.team2_players = team2Players;

        res.json({
            success: true,
            match
        });

    } catch (error) {
        console.error('Get match details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch match details',
        });
    }
};

/**
 * Update match result — score is calculated automatically from goal events
 * This endpoint is used to change match status (start, finish)
 */
const updateMatchResult = async (req, res) => {
    try {
        const { tournamentId, matchId } = req.params;
        const { status } = req.body;
        const userId = req.user.id;

        const [matches] = await db.promise().query(`
            SELECT m.*, t.organizer_id, t.type as tournament_type
            FROM matches m
            INNER JOIN tournaments t ON m.tournament_id = t.id
            WHERE m.tournament_id = ? AND m.id = ?
        `, [tournamentId, matchId]);

        if (matches.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        if (matches[0].organizer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the tournament organizer can update match results'
            });
        }

        const validStatuses = ['scheduled', 'in_progress', 'finished'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        // Prevent status from going backwards
        const currentStatus = matches[0].status;
        const statusOrder = { scheduled: 0, in_progress: 1, finished: 2 };
        if (statusOrder[status] < statusOrder[currentStatus]) {
            return res.status(400).json({
                success: false,
                message: `Cannot change match status from '${currentStatus}' back to '${status}'`
            });
        }

        // If finishing the match, calculate score from events
        if (status === 'finished') {
            const [goalEvents] = await db.promise().query(`
                SELECT team_id, is_own_goal FROM match_events
                WHERE match_id = ? AND event_type = 'goal'
            `, [matchId]);

            let team1Score = 0;
            let team2Score = 0;

            for (const event of goalEvents) {
                if (event.is_own_goal) {
                    // Own goal counts for the opposing team
                    if (event.team_id === matches[0].team1_id) {
                        team2Score++;
                    } else {
                        team1Score++;
                    }
                } else {
                    if (event.team_id === matches[0].team1_id) {
                        team1Score++;
                    } else {
                        team2Score++;
                    }
                }
            }

            // Forbid draw in playoff matches
            const tournamentType = matches[0].tournament_type;
            if ((tournamentType === 'playoff' || tournamentType === 'group_playoff') && team1Score === team2Score) {
                // Check if this is a playoff stage match (not group stage)
                const round = matches[0].round;
                const isPlayoffMatch = tournamentType === 'playoff' ||
                    (tournamentType === 'group_playoff' && !String(round).startsWith('Group'));

                if (isPlayoffMatch) {
                    return res.status(400).json({
                        success: false,
                        message: 'Draw is not allowed in playoff matches. Add more goals to determine a winner.'
                    });
                }
            }

            await db.promise().query(
                `UPDATE matches SET team1_score = ?, team2_score = ?, status = 'finished' WHERE id = ?`,
                [team1Score, team2Score, matchId]
            );

            // Recalculate standings
            await recalculateStandings(tournamentId);

            // Recalculate player statistics
            await recalculatePlayerStatistics(tournamentId);

            // Advance winner in playoff bracket
            const tournamentType2 = matches[0].tournament_type;
            const matchRound = matches[0].round;
            const matchBracketSlot = matches[0].bracket_slot;

            const isPlayoffRound = tournamentType2 === 'playoff' ||
                (tournamentType2 === 'group_playoff' && !String(matchRound).startsWith('Group'));

            if (isPlayoffRound && matchBracketSlot !== null) {
                const winnerId = team1Score > team2Score ? matches[0].team1_id : matches[0].team2_id;
                const nextRoundNum = parseInt(matchRound) + 1;
                const nextSlot = Math.ceil(matchBracketSlot / 2);
                const isTeam1Slot = matchBracketSlot % 2 === 1;

                const [nextMatch] = await db.promise().query(
                    `SELECT id FROM matches WHERE tournament_id = ? AND round = ? AND bracket_slot = ?`,
                    [tournamentId, String(nextRoundNum), nextSlot]
                );

                if (nextMatch.length > 0) {
                    const field = isTeam1Slot ? 'team1_id' : 'team2_id';
                    await db.promise().query(
                        `UPDATE matches SET ${field} = ? WHERE id = ?`,
                        [winnerId, nextMatch[0].id]
                    );
                }
            }

            // For group+playoff: check if group stage done → advance top 2 from each group
            if (tournamentType2 === 'group_playoff' && String(matchRound).startsWith('Group')) {
                await advanceGroupWinners(tournamentId, matchRound.split(' ')[1]);
            }

            // Check if all matches are finished → auto-finish tournament
            await checkAndFinishTournament(tournamentId);

            // Emit WebSocket events
            tournamentSocket.emitScoreUpdate(tournamentId, {
                id: matchId,
                team1_score: team1Score,
                team2_score: team2Score,
                status: 'finished'
            });
            await tournamentSocket.emitStandingsUpdate(tournamentId);

        } else {
            await db.promise().query(
                `UPDATE matches SET status = ? WHERE id = ?`,
                [status, matchId]
            );
        }

        res.json({
            success: true,
            message: 'Match updated successfully'
        });

    } catch (error) {
        console.error('Update match result error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update match result',
        });
    }
};

/**
 * Add match event (goal, card, substitution)
 * Supports own goals and assists
 */
const addMatchEvent = async (req, res) => {
    try {
        const { tournamentId, matchId } = req.params;
        const { playerId, teamId, eventType, minute, isOwnGoal, assistPlayerId, description } = req.body;
        const userId = req.user.id;

        if (!playerId || !teamId || !eventType || minute === undefined) {
            return res.status(400).json({
                success: false,
                message: 'playerId, teamId, eventType, and minute are required'
            });
        }

        const validTypes = ['goal', 'yellow_card', 'red_card', 'substitution'];
        if (!validTypes.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event type'
            });
        }

        const [matches] = await db.promise().query(`
            SELECT m.*, t.organizer_id
            FROM matches m
            INNER JOIN tournaments t ON m.tournament_id = t.id
            WHERE m.tournament_id = ? AND m.id = ?
        `, [tournamentId, matchId]);

        if (matches.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        if (matches[0].organizer_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Only the tournament organizer can add match events'
            });
        }

        if (matches[0].status === 'finished') {
            return res.status(400).json({
                success: false,
                message: 'Cannot add events to a finished match'
            });
        }

        // Verify player is in the team
        const [players] = await db.promise().query(
            'SELECT id FROM team_players WHERE team_id = ? AND player_id = ?',
            [teamId, playerId]
        );

        if (players.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Player is not in the specified team'
            });
        }

        // Verify assist player if provided
        if (assistPlayerId) {
            const [assistPlayer] = await db.promise().query(
                'SELECT id FROM team_players WHERE team_id = ? AND player_id = ?',
                [teamId, assistPlayerId]
            );

            if (assistPlayer.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Assist player is not in the specified team'
                });
            }
        }

        await db.promise().query(
            `INSERT INTO match_events
            (match_id, player_id, team_id, event_type, minute, is_own_goal, assist_player_id, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [matchId, playerId, teamId, eventType, minute, isOwnGoal || false, assistPlayerId || null, description || null]
        );

        // Emit WebSocket events
        const [playerInfo] = await db.promise().query(
            `SELECT u.name as player_name, t.name as team_name
             FROM users u, teams t WHERE u.id = ? AND t.id = ?`,
            [playerId, teamId]
        );

        tournamentSocket.emitMatchEvent(tournamentId, {
            match_id: matchId,
            event_type: eventType,
            player_id: playerId,
            player_name: playerInfo[0]?.player_name,
            team_id: teamId,
            team_name: playerInfo[0]?.team_name,
            minute
        });

        res.status(201).json({
            success: true,
            message: 'Match event added successfully'
        });

    } catch (error) {
        console.error('Add match event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add match event',
        });
    }
};

/**
 * Delete match event (before match is finished)
 */
const deleteMatchEvent = async (req, res) => {
    try {
        const { tournamentId, matchId, eventId } = req.params;
        const userId = req.user.id;

        const [matches] = await db.promise().query(`
            SELECT m.status, t.organizer_id
            FROM matches m
            INNER JOIN tournaments t ON m.tournament_id = t.id
            WHERE m.tournament_id = ? AND m.id = ?
        `, [tournamentId, matchId]);

        if (matches.length === 0) {
            return res.status(404).json({ success: false, message: 'Match not found' });
        }

        if (matches[0].organizer_id !== userId) {
            return res.status(403).json({ success: false, message: 'Only the organizer can delete events' });
        }

        if (matches[0].status === 'finished') {
            return res.status(400).json({ success: false, message: 'Cannot delete events from a finished match' });
        }

        const [event] = await db.promise().query(
            'SELECT id FROM match_events WHERE id = ? AND match_id = ?',
            [eventId, matchId]
        );

        if (event.length === 0) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        await db.promise().query('DELETE FROM match_events WHERE id = ?', [eventId]);

        res.json({ success: true, message: 'Event deleted' });

    } catch (error) {
        console.error('Delete match event error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete event', error: error.message });
    }
};

/**
 * Get tournament standings
 */
const getStandings = async (req, res) => {
    try {
        const { id } = req.params;

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

        res.json({
            success: true,
            standings
        });

    } catch (error) {
        console.error('Get standings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch standings',
        });
    }
};

/**
 * Initialize standings for all teams in tournament
 */
const initializeStandings = async (tournamentId) => {
    const [teams] = await db.promise().query(
        'SELECT team_id FROM tournament_teams WHERE tournament_id = ?',
        [tournamentId]
    );

    for (const team of teams) {
        await db.promise().query(`
            INSERT IGNORE INTO standings
            (tournament_id, team_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points)
            VALUES (?, ?, 0, 0, 0, 0, 0, 0, 0, 0)
        `, [tournamentId, team.team_id]);
    }
};

/**
 * Recalculate all standings for a tournament based on finished matches
 */
const recalculateStandings = async (tournamentId) => {
    // Reset all standings
    await db.promise().query(`
        UPDATE standings
        SET played = 0, won = 0, drawn = 0, lost = 0,
            goals_for = 0, goals_against = 0, goal_difference = 0, points = 0
        WHERE tournament_id = ?
    `, [tournamentId]);

    // Get all finished matches
    const [matches] = await db.promise().query(`
        SELECT team1_id, team2_id, team1_score, team2_score
        FROM matches
        WHERE tournament_id = ? AND status = 'finished'
    `, [tournamentId]);

    for (const match of matches) {
        const { team1_id, team2_id, team1_score, team2_score } = match;

        let team1Points = 0, team2Points = 0;
        let team1Won = 0, team1Draw = 0, team1Lost = 0;
        let team2Won = 0, team2Draw = 0, team2Lost = 0;

        if (team1_score > team2_score) {
            team1Points = 3; team1Won = 1; team2Lost = 1;
        } else if (team1_score < team2_score) {
            team2Points = 3; team2Won = 1; team1Lost = 1;
        } else {
            team1Points = 1; team2Points = 1; team1Draw = 1; team2Draw = 1;
        }

        // Update team 1
        await db.promise().query(`
            UPDATE standings SET
                played = played + 1, won = won + ?, drawn = drawn + ?, lost = lost + ?,
                goals_for = goals_for + ?, goals_against = goals_against + ?,
                goal_difference = goal_difference + ?, points = points + ?
            WHERE tournament_id = ? AND team_id = ?
        `, [team1Won, team1Draw, team1Lost, team1_score, team2_score, team1_score - team2_score, team1Points, tournamentId, team1_id]);

        // Update team 2
        await db.promise().query(`
            UPDATE standings SET
                played = played + 1, won = won + ?, drawn = drawn + ?, lost = lost + ?,
                goals_for = goals_for + ?, goals_against = goals_against + ?,
                goal_difference = goal_difference + ?, points = points + ?
            WHERE tournament_id = ? AND team_id = ?
        `, [team2Won, team2Draw, team2Lost, team2_score, team1_score, team2_score - team1_score, team2Points, tournamentId, team2_id]);
    }
};

/**
 * After all matches in a group finish, assign top 2 teams to the playoff bracket.
 * Cross-bracket seeding: A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, ...
 */
const advanceGroupWinners = async (tournamentId, groupLetter) => {
    try {
        // Check if all group matches for this group are finished
        const [groupMatches] = await db.promise().query(
            `SELECT status FROM matches WHERE tournament_id = ? AND round = ?`,
            [tournamentId, `Group ${groupLetter}`]
        );

        const allDone = groupMatches.every(m => m.status === 'finished');
        if (!allDone) return; // Group not complete yet

        // Get all groups for this tournament
        const [allGroupMatches] = await db.promise().query(
            `SELECT DISTINCT round FROM matches WHERE tournament_id = ? AND round LIKE 'Group %'`,
            [tournamentId]
        );
        const groupLetters = allGroupMatches.map(r => r.round.replace('Group ', '')).sort();

        // Check if ALL groups are done
        for (const gl of groupLetters) {
            const [gm] = await db.promise().query(
                `SELECT status FROM matches WHERE tournament_id = ? AND round = ?`,
                [tournamentId, `Group ${gl}`]
            );
            if (gm.some(m => m.status !== 'finished')) return; // Not all groups done
        }

        // All groups finished — determine top 2 from each group via standings
        const groupStandings = {};
        for (const gl of groupLetters) {
            const [gTeams] = await db.promise().query(`
                SELECT DISTINCT team1_id as team_id FROM matches
                WHERE tournament_id = ? AND round = ?
                UNION
                SELECT DISTINCT team2_id FROM matches
                WHERE tournament_id = ? AND round = ?
            `, [tournamentId, `Group ${gl}`, tournamentId, `Group ${gl}`]);

            const teamIds = gTeams.map(t => t.team_id);
            const [standings] = await db.promise().query(`
                SELECT team_id, points, goal_difference, goals_for
                FROM standings WHERE tournament_id = ? AND team_id IN (?)
                ORDER BY points DESC, goal_difference DESC, goals_for DESC
            `, [tournamentId, teamIds]);

            groupStandings[gl] = standings.map(s => s.team_id);
        }

        // Get playoff matches ordered by bracket_slot
        const [playoffMatches] = await db.promise().query(`
            SELECT id, round, bracket_slot FROM matches
            WHERE tournament_id = ? AND round NOT LIKE 'Group %'
            ORDER BY match_date ASC, bracket_slot ASC
        `, [tournamentId]);

        if (playoffMatches.length === 0) return;

        // Find first playoff round matches (those with null team1_id and team2_id)
        const firstPlayoffRound = playoffMatches[0].round;
        const firstRoundMatches = playoffMatches
            .filter(m => m.round === firstPlayoffRound)
            .sort((a, b) => a.bracket_slot - b.bracket_slot);

        // Cross-seeding: A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, ...
        // For N groups: pair group[i] winner with group[i+1] runner-up (alternating)
        const seeds = [];
        for (let i = 0; i < groupLetters.length; i += 2) {
            const glA = groupLetters[i];
            const glB = groupLetters[i + 1];
            if (glB) {
                seeds.push({ team1: groupStandings[glA][0], team2: groupStandings[glB][1] });
                seeds.push({ team1: groupStandings[glB][0], team2: groupStandings[glA][1] });
            }
        }

        for (let i = 0; i < firstRoundMatches.length && i < seeds.length; i++) {
            await db.promise().query(
                `UPDATE matches SET team1_id = ?, team2_id = ? WHERE id = ?`,
                [seeds[i].team1, seeds[i].team2, firstRoundMatches[i].id]
            );
        }

        console.log(`Group stage complete for tournament ${tournamentId} — playoff bracket populated`);
    } catch (err) {
        console.error('advanceGroupWinners error:', err);
    }
};

/**
 * Check if all matches are finished and auto-finish tournament
 */
const checkAndFinishTournament = async (tournamentId) => {
    const [result] = await db.promise().query(`
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'finished' THEN 1 ELSE 0 END) as finished
        FROM matches WHERE tournament_id = ?
    `, [tournamentId]);

    if (result[0].total > 0 && result[0].total === result[0].finished) {
        await db.promise().query(
            `UPDATE tournaments SET status = 'finished' WHERE id = ?`,
            [tournamentId]
        );
        console.log(`Tournament ${tournamentId} auto-finished: all matches completed`);
    }
};

/**
 * Get player statistics for a tournament
 */
const getPlayerStatistics = async (req, res) => {
    try {
        const { id } = req.params;

        const [statistics] = await db.promise().query(`
            SELECT
                ps.*,
                u.name as player_name,
                t.name as team_name,
                t.logo as team_logo,
                t.logo_color as team_color
            FROM player_statistics ps
            INNER JOIN users u ON ps.player_id = u.id
            INNER JOIN teams t ON ps.team_id = t.id
            WHERE ps.tournament_id = ?
            ORDER BY ps.goals DESC, ps.assists DESC, u.name ASC
        `, [id]);

        res.json({
            success: true,
            statistics
        });

    } catch (error) {
        console.error('Get player statistics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch player statistics',
        });
    }
};

/**
 * Recalculate player statistics from match events
 * Now includes assists tracking
 */
const recalculatePlayerStatistics = async (tournamentId) => {
    await db.promise().query(
        'DELETE FROM player_statistics WHERE tournament_id = ?',
        [tournamentId]
    );

    // Get all events (goals, cards) from finished matches
    const [events] = await db.promise().query(`
        SELECT
            me.player_id,
            me.team_id,
            me.event_type,
            me.is_own_goal,
            me.assist_player_id
        FROM match_events me
        INNER JOIN matches m ON me.match_id = m.id
        WHERE m.tournament_id = ? AND m.status = 'finished'
    `, [tournamentId]);

    const playerStats = {};

    const getKey = (playerId, teamId) => `${playerId}_${teamId}`;
    const ensurePlayer = (playerId, teamId) => {
        const key = getKey(playerId, teamId);
        if (!playerStats[key]) {
            playerStats[key] = {
                player_id: playerId,
                team_id: teamId,
                goals: 0,
                assists: 0,
                yellow_cards: 0,
                red_cards: 0,
                matches_played: 0
            };
        }
        return playerStats[key];
    };

    for (const event of events) {
        const stats = ensurePlayer(event.player_id, event.team_id);

        if (event.event_type === 'goal' && !event.is_own_goal) {
            stats.goals++;
        } else if (event.event_type === 'yellow_card') {
            stats.yellow_cards++;
        } else if (event.event_type === 'red_card') {
            stats.red_cards++;
        }

        // Track assists
        if (event.event_type === 'goal' && event.assist_player_id) {
            const assistStats = ensurePlayer(event.assist_player_id, event.team_id);
            assistStats.assists++;
        }
    }

    for (const stats of Object.values(playerStats)) {
        await db.promise().query(`
            INSERT INTO player_statistics
            (tournament_id, player_id, team_id, goals, assists, yellow_cards, red_cards, matches_played)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [tournamentId, stats.player_id, stats.team_id, stats.goals, stats.assists, stats.yellow_cards, stats.red_cards, stats.matches_played]);
    }
};

module.exports = {
    getTournaments,
    createTournament,
    updateTournament,
    deleteTournament,
    joinTournament,
    leaveTournament,
    checkUserJoined,
    previewFixtures,
    generateFixtures,
    getAllMatches,
    getTournamentMatches,
    getMatchDetails,
    updateMatchResult,
    addMatchEvent,
    deleteMatchEvent,
    getStandings,
    initializeStandings,
    recalculateStandings,
    getPlayerStatistics,
    recalculatePlayerStatistics
};
