/* ==============================================
   TOURNAMENT CONTROLLER - Логика турниров
   ============================================== */

const db = require('../config/database');

// ========== ПОЛУЧИТЬ ВСЕ ТУРНИРЫ ==========

const getTournaments = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.*,
                u.name as organizer_name,
                COUNT(DISTINCT tt.team_id) as teams_count
            FROM tournaments t
            LEFT JOIN users u ON t.organizer_id = u.id
            LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `;
        
        const [tournaments] = await db.promise().query(query);
        
        console.log(`✅ Fetched ${tournaments.length} tournaments`);
        
        res.json({
            success: true,
            tournaments
        });
        
    } catch (error) {
        console.error('❌ Get tournaments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tournaments',
            error: error.message
        });
    }
};

// ========== ПОЛУЧИТЬ ТУРНИР ПО ID ==========

const getTournamentById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                t.*,
                u.name as organizer_name,
                COUNT(DISTINCT tt.team_id) as teams_count
            FROM tournaments t
            LEFT JOIN users u ON t.organizer_id = u.id
            LEFT JOIN tournament_teams tt ON t.id = tt.tournament_id
            WHERE t.id = ?
            GROUP BY t.id
        `;
        
        const [tournaments] = await db.promise().query(query, [id]);
        
        if (tournaments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tournament not found'
            });
        }
        
        res.json({
            success: true,
            tournament: tournaments[0]
        });
        
    } catch (error) {
        console.error('❌ Get tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tournament',
            error: error.message
        });
    }
};

// ========== СОЗДАТЬ ТУРНИР ==========

const createTournament = async (req, res) => {
    try {
        const { name, type, startDate, endDate, location, description, maxTeams } = req.body;
        const organizerId = req.user.id;
        
        // Валидация
        if (!name || !type || !startDate || !endDate || !maxTeams) {
            return res.status(400).json({
                success: false,
                message: 'Required fields: name, type, startDate, endDate, maxTeams'
            });
        }
        
        // Проверка типа турнира
        const validTypes = ['league', 'playoff', 'group_playoff'];
        if (!validTypes.includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid tournament type'
            });
        }
        
        // Проверка дат
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
            return res.status(400).json({
                success: false,
                message: 'End date must be after start date'
            });
        }
        
        // Определяем статус
        const now = new Date();
        let status = 'upcoming';
        if (now >= start && now <= end) {
            status = 'active';
        } else if (now > end) {
            status = 'finished';
        }
        
        // Создаём турнир
        const [result] = await db.promise().query(
            `INSERT INTO tournaments 
            (name, type, start_date, end_date, location, description, max_teams, status, organizer_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, startDate, endDate, location, description, maxTeams, status, organizerId]
        );
        
        const tournamentId = result.insertId;
        
        console.log('✅ Tournament created:', name, `(ID: ${tournamentId})`);
        
        res.status(201).json({
            success: true,
            message: 'Tournament created successfully',
            tournament: {
                id: tournamentId,
                name,
                type,
                start_date: startDate,
                end_date: endDate,
                location,
                description,
                max_teams: maxTeams,
                status,
                organizer_id: organizerId
            }
        });
        
    } catch (error) {
        console.error('❌ Create tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create tournament',
            error: error.message
        });
    }
};

// ========== ОБНОВИТЬ ТУРНИР ==========

const updateTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, startDate, endDate, location, description, maxTeams, status } = req.body;
        const userId = req.user.id;
        
        // Проверяем существует ли турнир и является ли пользователь организатором
        const [tournaments] = await db.promise().query(
            'SELECT organizer_id FROM tournaments WHERE id = ?',
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
        
        // Обновляем турнир
        await db.promise().query(
            `UPDATE tournaments 
            SET name = ?, type = ?, start_date = ?, end_date = ?, 
                location = ?, description = ?, max_teams = ?, status = ?
            WHERE id = ?`,
            [name, type, startDate, endDate, location, description, maxTeams, status, id]
        );
        
        console.log('✅ Tournament updated:', id);
        
        res.json({
            success: true,
            message: 'Tournament updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Update tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update tournament',
            error: error.message
        });
    }
};

// ========== УДАЛИТЬ ТУРНИР ==========

const deleteTournament = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Проверяем существует ли турнир и является ли пользователь организатором
        const [tournaments] = await db.promise().query(
            'SELECT organizer_id FROM tournaments WHERE id = ?',
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
        
        // Удаляем турнир
        await db.promise().query('DELETE FROM tournaments WHERE id = ?', [id]);
        
        console.log('✅ Tournament deleted:', id);
        
        res.json({
            success: true,
            message: 'Tournament deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete tournament error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete tournament',
            error: error.message
        });
    }
};

// ========== ԹԻՄԸ ՄԻԱՆՈՒՄ Է ՄՐՑԱՇԱՐԻՆ ==========

const joinTournament = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user.id;
        
        // 1. Գտնել մարզչի թիմը
        const [teams] = await db.promise().query(
            'SELECT id FROM teams WHERE coach_id = ?',
            [userId]
        );
        
        if (teams.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Դուք չունեք թիմ։ Նախ պետք է ստեղծեք թիմ։'
            });
        }
        
        const teamId = teams[0].id;
        
        // 2. Ստուգել մրցաշարը գոյություն ունի
        const [tournaments] = await db.promise().query(
            'SELECT max_teams FROM tournaments WHERE id = ?',
            [tournamentId]
        );
        
        if (tournaments.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Մրցաշարը չի գտնվել'
            });
        }
        
        const maxTeams = tournaments[0].max_teams;
        
        // 3. Ստուգել արդեն միացե՞լ է
        const [existing] = await db.promise().query(
            'SELECT id FROM tournament_teams WHERE tournament_id = ? AND team_id = ?',
            [tournamentId, teamId]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ձեր թիմն արդեն միացել է այս մրցաշարին'
            });
        }
        
        // 4. Ստուգել լիքը չէ
        const [currentTeams] = await db.promise().query(
            'SELECT COUNT(*) as count FROM tournament_teams WHERE tournament_id = ?',
            [tournamentId]
        );
        
        if (currentTeams[0].count >= maxTeams) {
            return res.status(400).json({
                success: false,
                message: 'Մրցաշարը լիքն է։ Ավելի թիմեր չեն կարող միանալ։'
            });
        }
        
        // 5. Միացնել թիմը մրցաշարին
        await db.promise().query(
            'INSERT INTO tournament_teams (tournament_id, team_id) VALUES (?, ?)',
            [tournamentId, teamId]
        );
        
        console.log('✅ Թիմը միացավ մրցաշարին:', teamId, '→', tournamentId);
        
        res.json({
            success: true,
            message: 'Թիմը հաջողությամբ միացավ մրցաշարին'
        });
        
    } catch (error) {
        console.error('❌ Միանալու սխալ:', error);
        res.status(500).json({
            success: false,
            message: 'Չհաջողվեց միանալ մրցաշարին',
            error: error.message
        });
    }
};

// ========== ՍՏՈՒԳԵԼ ՄԻԱՑԵ՞Լ Է ==========

const checkUserJoined = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const userId = req.user.id;
        
        // Գտնել մարզչի թիմը
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
        
        // Ստուգել միացե՞լ է
        const [joined] = await db.promise().query(
            'SELECT id FROM tournament_teams WHERE tournament_id = ? AND team_id = ?',
            [tournamentId, teamId]
        );
        
        console.log('🔍 Check joined:', tournamentId, 'Team:', teamId, 'Joined:', joined.length > 0);
        
        res.json({
            success: true,
            joined: joined.length > 0,
            hasTeam: true
        });
        
    } catch (error) {
        console.error('❌ Check joined error:', error);
        res.status(500).json({
            success: false,
            message: 'Չհաջողվեց ստուգել',
            error: error.message
        });
    }
};

// ========== PREVIEW FIXTURES ==========

const previewFixtures = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const { startDate, matchDays, matchTime, matchesPerDay, daysBetweenRounds, venue } = req.body;
        
        if (!startDate || !matchDays || !matchTime || !matchesPerDay) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }
        
        const fixturesGenerator = require('../helpers/fixturesGenerator');
        
        const [teams] = await db.promise().query(`
            SELECT t.id, t.name
            FROM teams t
            INNER JOIN tournament_teams tt ON t.id = tt.team_id
            WHERE tt.tournament_id = ?
        `, [tournamentId]);
        
        if (teams.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Նվազագույնը 2 թիմ է պետք մրցաշարում'
            });
        }
        
        const rounds = fixturesGenerator.generateRoundRobinDouble(teams);
        const settings = {
            startDate,
            matchDays,
            matchTime,
            matchesPerDay,
            daysBetweenRounds: daysBetweenRounds || 0,
            venue: venue || 'TBD'
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
                teamA: teamA.name,
                teamB: teamB.name
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
        console.error('❌ Preview fixtures error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to preview fixtures'
        });
    }
};

// ========== GENERATE FIXTURES ==========

const generateFixtures = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        const { startDate, matchDays, matchTime, matchesPerDay, daysBetweenRounds, venue } = req.body;
        
        if (!startDate || !matchDays || !matchTime || !matchesPerDay) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
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
            SELECT t.id, t.name
            FROM teams t
            INNER JOIN tournament_teams tt ON t.id = tt.team_id
            WHERE tt.tournament_id = ?
        `, [tournamentId]);
        
        if (teams.length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Նվազագույնը 2 թիմ է պետք մրցաշարում'
            });
        }
        
        const rounds = fixturesGenerator.generateRoundRobinDouble(teams);
        const settings = {
            startDate,
            matchDays,
            matchTime,
            matchesPerDay,
            daysBetweenRounds: daysBetweenRounds || 0,
            venue: venue || 'TBD'
        };

        const scheduledMatches = fixturesGenerator.scheduleMatches(rounds, settings);
        
        for (const match of scheduledMatches) {
            await db.promise().query(
                `INSERT INTO matches 
                (tournament_id, round, home_team_id, away_team_id, match_date, venue, status)
                VALUES (?, ?, ?, ?, ?, ?, 'scheduled')`,
                [tournamentId, match.round, match.teamAId, match.teamBId, match.matchDate, match.venue]
            );
        }
        
        const [savedMatches] = await db.promise().query(`
            SELECT m.*, ta.name as home_team_name, tb.name as away_team_name
            FROM matches m
            INNER JOIN teams ta ON m.home_team_id = ta.id
            INNER JOIN teams tb ON m.away_team_id = tb.id
            WHERE m.tournament_id = ?
            ORDER BY m.round, m.match_date
        `, [tournamentId]);
        
        console.log('✅ Generated', scheduledMatches.length, 'matches');
        
        res.json({
            success: true,
            message: `${scheduledMatches.length} matches generated successfully`,
            matches: savedMatches
        });
        
    } catch (error) {
        console.error('❌ Generate fixtures error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate fixtures'
        });
    }
};

// ========== GET TOURNAMENT MATCHES ==========

const getTournamentMatches = async (req, res) => {
    try {
        const tournamentId = req.params.id;
        
        const query = `
            SELECT 
                m.*,
                t.organizer_id,
                th.name as home_team_name,
                th.logo as home_team_logo,
                th.logo_color as home_team_color,
                ta.name as away_team_name,
                ta.logo as away_team_logo,
                ta.logo_color as away_team_color
            FROM matches m
            INNER JOIN tournaments t ON m.tournament_id = t.id
            INNER JOIN teams th ON m.home_team_id = th.id
            INNER JOIN teams ta ON m.away_team_id = ta.id
            WHERE m.tournament_id = ?
            ORDER BY m.round, m.match_date
        `;
        
        const [matches] = await db.promise().query(query, [tournamentId]);
        
        console.log(`✅ Fetched ${matches.length} matches for tournament ${tournamentId}`);
        
        res.json({
            success: true,
            matches
        });
        
    } catch (error) {
        console.error('❌ Get tournament matches error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch matches',
            error: error.message
        });
    }
};

// ========== GET MATCH DETAILS (ՆՈՐ) ==========

const getMatchDetails = async (req, res) => {
    try {
        const { tournamentId, matchId } = req.params;
        
        // Get match info
        const [matches] = await db.promise().query(`
            SELECT 
                m.*,
                t.organizer_id,
                ta.name as home_team_name,
                ta.logo as home_team_logo,
                ta.logo_color as home_team_color,
                tb.name as away_team_name,
                tb.logo as away_team_logo,
                tb.logo_color as away_team_color
            FROM matches m
            INNER JOIN tournaments t ON m.tournament_id = t.id
            INNER JOIN teams ta ON m.home_team_id = ta.id
            INNER JOIN teams tb ON m.away_team_id = tb.id
            WHERE m.tournament_id = ? AND m.id = ?
        `, [tournamentId, matchId]);
        
        if (matches.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
        
        const match = matches[0];
        
        // Get match events
        const [events] = await db.promise().query(`
            SELECT 
                me.*,
                u.name as player_name,
                t.name as team_name
            FROM match_events me
            INNER JOIN users u ON me.player_id = u.id
            INNER JOIN teams t ON me.team_id = t.id
            WHERE me.match_id = ?
            ORDER BY me.minute ASC
        `, [matchId]);
        
        match.events = events;
        
        console.log('✅ Fetched match details:', matchId);
        
        res.json({
            success: true,
            match
        });
        
    } catch (error) {
        console.error('❌ Get match details error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch match details',
            error: error.message
        });
    }
};

// ========== UPDATE MATCH RESULT (ՆՈՐ) ==========

const updateMatchResult = async (req, res) => {
    try {
        const { tournamentId, matchId } = req.params;
        const { homeScore, awayScore, status } = req.body;
        const userId = req.user.id;
        
        // Validate scores
        if (homeScore === undefined || awayScore === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Home score and away score are required'
            });
        }
        
        if (homeScore < 0 || awayScore < 0) {
            return res.status(400).json({
                success: false,
                message: 'Scores cannot be negative'
            });
        }
        
        // Check if match exists and user is organizer
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
                message: 'Only the tournament organizer can update match results'
            });
        }
        
        // Update match
        await db.promise().query(
            `UPDATE matches 
            SET home_score = ?, away_score = ?, status = ?
            WHERE id = ?`,
            [homeScore, awayScore, status || 'finished', matchId]
        );
        
        console.log('✅ Match result updated:', matchId, `(${homeScore} - ${awayScore})`);
        
        res.json({
            success: true,
            message: 'Match result updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Update match result error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update match result',
            error: error.message
        });
    }
};

// ========== ADD MATCH EVENT (ՆՈՐ) ==========

const addMatchEvent = async (req, res) => {
    try {
        const { tournamentId, matchId } = req.params;
        const { playerId, teamId, eventType, minute, description } = req.body;
        const userId = req.user.id;
        
        // Validate
        if (!playerId || !teamId || !eventType || minute === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Player, team, event type, and minute are required'
            });
        }
        
        // Validate event type
        const validTypes = ['goal', 'yellow_card', 'red_card', 'substitution'];
        if (!validTypes.includes(eventType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid event type'
            });
        }
        
        // Check if match exists and user is organizer
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
        
        // Verify player exists and is in the team
        const [players] = await db.promise().query(`
            SELECT tp.id
            FROM team_players tp
            WHERE tp.team_id = ? AND tp.player_id = ?
        `, [teamId, playerId]);
        
        if (players.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Player is not in the specified team'
            });
        }
        
        // Add event
        await db.promise().query(
            `INSERT INTO match_events 
            (match_id, player_id, team_id, event_type, minute, description)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [matchId, playerId, teamId, eventType, minute, description || null]
        );
        
        console.log('✅ Match event added:', eventType, 'Player:', playerId, 'Minute:', minute);
        
        res.status(201).json({
            success: true,
            message: 'Match event added successfully'
        });
        
    } catch (error) {
        console.error('❌ Add match event error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add match event',
            error: error.message
        });
    }
};

module.exports = {
    getTournaments,
    getTournamentById,
    createTournament,
    updateTournament,
    deleteTournament,
    joinTournament,
    checkUserJoined,
    previewFixtures,
    generateFixtures,
    getTournamentMatches,
    getMatchDetails,      // ՆՈՐ
    updateMatchResult,    // ՆՈՐ
    addMatchEvent         // ՆՈՐ
};