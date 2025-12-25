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

module.exports = {
    getTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam
};