/* ==============================================
   TEAM CONTROLLER - Логика команд
   ============================================== */

const db = require('../config/database');

// ========== ПОЛУЧИТЬ ВСЕ КОМАНДЫ ==========

const getTeams = async (req, res) => {
    try {
        const query = `
            SELECT 
                t.*,
                u.name as coach_name,
                COUNT(DISTINCT tp.player_id) as players_count
            FROM teams t
            LEFT JOIN users u ON t.coach_id = u.id
            LEFT JOIN team_players tp ON t.id = tp.team_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        `;
        
        const [teams] = await db.promise().query(query);
        
        console.log(`✅ Fetched ${teams.length} teams`);
        
        res.json({
            success: true,
            teams
        });
        
    } catch (error) {
        console.error('❌ Get teams error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch teams',
            error: error.message
        });
    }
};

// ========== ПОЛУЧИТЬ КОМАНДУ ПО ID ==========

const getTeamById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const query = `
            SELECT 
                t.*,
                u.name as coach_name,
                COUNT(DISTINCT tp.player_id) as players_count
            FROM teams t
            LEFT JOIN users u ON t.coach_id = u.id
            LEFT JOIN team_players tp ON t.id = tp.team_id
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
        
        // Получаем игроков команды
        const [players] = await db.promise().query(
            `SELECT 
                tp.id as team_player_id,
                tp.player_id,
                tp.position,
                tp.jersey_number,
                u.name as player_name,
                u.email as player_email
            FROM team_players tp
            LEFT JOIN users u ON tp.player_id = u.id
            WHERE tp.team_id = ?
            ORDER BY tp.jersey_number`,
            [id]
        );
        
        const team = teams[0];
        team.players = players;
        
        res.json({
            success: true,
            team
        });
        
    } catch (error) {
        console.error('❌ Get team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team',
            error: error.message
        });
    }
};

// ========== СОЗДАТЬ КОМАНДУ ==========

const createTeam = async (req, res) => {
    try {
        const { name, logo, logoColor, stadium, description, maxPlayers } = req.body;
        const coachId = req.user.id;
        
        // Валидация
        if (!name) {
            return res.status(400).json({
                success: false,
                message: 'Team name is required'
            });
        }
        
        // Проверяем не создал ли тренер уже команду
        const [existingTeams] = await db.promise().query(
            'SELECT id FROM teams WHERE coach_id = ?',
            [coachId]
        );
        
        if (existingTeams.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You already have a team. Delete it first to create a new one.'
            });
        }
        
        // Создаём команду
        const [result] = await db.promise().query(
            `INSERT INTO teams 
            (name, logo, logo_color, stadium, description, max_players, coach_id) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, logo, logoColor, stadium, description, maxPlayers || 25, coachId]
        );
        
        const teamId = result.insertId;
        
        console.log('✅ Team created:', name, `(ID: ${teamId})`);
        
        res.status(201).json({
            success: true,
            message: 'Team created successfully',
            team: {
                id: teamId,
                name,
                logo,
                logo_color: logoColor,
                stadium,
                description,
                max_players: maxPlayers || 25,
                coach_id: coachId
            }
        });
        
    } catch (error) {
        console.error('❌ Create team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create team',
            error: error.message
        });
    }
};

// ========== ОБНОВИТЬ КОМАНДУ ==========

const updateTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logo, logoColor, stadium, description, maxPlayers } = req.body;
        const userId = req.user.id;
        
        // Проверяем существует ли команда и является ли пользователь тренером
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
        
        // Обновляем команду
        await db.promise().query(
            `UPDATE teams 
            SET name = ?, logo = ?, logo_color = ?, stadium = ?, 
                description = ?, max_players = ?
            WHERE id = ?`,
            [name, logo, logoColor, stadium, description, maxPlayers, id]
        );
        
        console.log('✅ Team updated:', id);
        
        res.json({
            success: true,
            message: 'Team updated successfully'
        });
        
    } catch (error) {
        console.error('❌ Update team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update team',
            error: error.message
        });
    }
};

// ========== УДАЛИТЬ КОМАНДУ ==========

const deleteTeam = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        
        // Проверяем существует ли команда и является ли пользователь тренером
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
        
        // Удаляем команду
        await db.promise().query('DELETE FROM teams WHERE id = ?', [id]);
        
        console.log('✅ Team deleted:', id);
        
        res.json({
            success: true,
            message: 'Team deleted successfully'
        });
        
    } catch (error) {
        console.error('❌ Delete team error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete team',
            error: error.message
        });
    }
};

// ========== ՓՆՏՐԵԼ ԽԱՂԱՑՈՂՆԵՐ (EMAIL-ՈՎ) ==========

const searchPlayers = async (req, res) => {
    try {
        const { email } = req.query;
        
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email query parameter is required'
            });
        }
        
        // Փնտրում ենք players որոնք role-ը 'player' է
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
            WHERE u.role = 'player' AND u.email LIKE ?
            LIMIT 10`,
            [`%${email}%`]
        );
        
        console.log(`🔍 Found ${players.length} players matching "${email}"`);
        
        res.json({
            success: true,
            players
        });
        
    } catch (error) {
        console.error('❌ Search players error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search players',
            error: error.message
        });
    }
};

// ========== ԱՎԵԼԱՑՆԵԼ ԽԱՂԱՑՈՂ ԹԻՄԻՆ ==========

const addPlayerToTeam = async (req, res) => {
    try {
        const teamId = req.params.teamId;
        const { playerId, jerseyNumber, position } = req.body;
        const coachId = req.user.id;
        
        // Validation
        if (!playerId || !jerseyNumber || !position) {
            return res.status(400).json({
                success: false,
                message: 'playerId, jerseyNumber, and position are required'
            });
        }
        
        // Ստուգում ենք թիմը գոյություն ունի և coach-ը սեփականատեր է
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
        
        // Ստուգում ենք player-ը գոյություն ունի և role-ը player է
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
        
        // Ստուգում ենք player-ը արդեն մեկ ուրիշ թիմում չէ
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
        
        // Ստուգում ենք թիմը լիքը չէ
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
        
        // Ստուգում ենք jersey number-ը թիմում ազատ է
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
        
        // Վավերացնում ենք jersey number-ը (1-99)
        if (jerseyNumber < 1 || jerseyNumber > 99) {
            return res.status(400).json({
                success: false,
                message: 'Jersey number must be between 1 and 99'
            });
        }
        
        // Վավերացնում ենք position-ը
        const validPositions = ['goalkeeper', 'defender', 'midfielder', 'forward'];
        if (!validPositions.includes(position)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid position. Must be: goalkeeper, defender, midfielder, or forward'
            });
        }
        
        // Ավելացնում ենք player-ին թիմին
        await db.promise().query(
            `INSERT INTO team_players (team_id, player_id, jersey_number, position)
            VALUES (?, ?, ?, ?)`,
            [teamId, playerId, jerseyNumber, position]
        );
        
        console.log(`✅ Player ${playerId} added to team ${teamId} (#${jerseyNumber}, ${position})`);
        
        res.status(201).json({
            success: true,
            message: 'Player added to team successfully'
        });
        
    } catch (error) {
        console.error('❌ Add player error:', error);
        
        // MySQL duplicate entry error
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

// ========== ՀԵՌԱՑՆԵԼ ԽԱՂԱՑՈՂ ԹԻՄԻՑ ==========

const removePlayerFromTeam = async (req, res) => {
    try {
        const { teamId, playerId } = req.params;
        const coachId = req.user.id;
        
        // Ստուգում ենք թիմը գոյություն ունի և coach-ը սեփականատեր է
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
        
        // Ստուգում ենք player-ը թիմում է
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
        
        // Հեռացնում ենք player-ին
        await db.promise().query(
            'DELETE FROM team_players WHERE team_id = ? AND player_id = ?',
            [teamId, playerId]
        );
        
        console.log(`✅ Player ${playerId} removed from team ${teamId}`);
        
        res.json({
            success: true,
            message: 'Player removed from team successfully'
        });
        
    } catch (error) {
        console.error('❌ Remove player error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove player from team',
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
    searchPlayers,        // ՆՈՐ
    addPlayerToTeam,      // ՆՈՐ
    removePlayerFromTeam  // ՆՈՐ
};