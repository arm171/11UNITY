/* ==============================================
   TEAM ROUTES - Маршруты команд
   ============================================== */

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { verifyToken, checkRole } = require('../middleware/auth');

// GET /api/teams - Получить все команды (доступно всем)
router.get('/', teamController.getTeams);

// GET /api/teams/:id - Получить команду по ID (доступно всем)
router.get('/:id', teamController.getTeamById);

// POST /api/teams - Создать команду (только coach)
router.post('/', 
    verifyToken, 
    checkRole('coach'), 
    teamController.createTeam
);

// PUT /api/teams/:id - Обновить команду (только coach)
router.put('/:id', 
    verifyToken, 
    checkRole('coach'), 
    teamController.updateTeam
);

// DELETE /api/teams/:id - Удалить команду (только coach)
router.delete('/:id', 
    verifyToken, 
    checkRole('coach'), 
    teamController.deleteTeam
);

// ========== PLAYERS MANAGEMENT ROUTES (ՆՈՐ) ==========

// GET /api/teams/:teamId/players/search?email=xxx - Փնտրել խաղացողներ email-ով (coach only)
router.get('/:teamId/players/search',
    verifyToken,
    checkRole('coach'),
    teamController.searchPlayers
);

// POST /api/teams/:teamId/players - Ավելացնել խաղացող թիմին (coach only)
router.post('/:teamId/players',
    verifyToken,
    checkRole('coach'),
    teamController.addPlayerToTeam
);

// DELETE /api/teams/:teamId/players/:playerId - Հեռացնել խաղացող թիմից (coach only)
router.delete('/:teamId/players/:playerId',
    verifyToken,
    checkRole('coach'),
    teamController.removePlayerFromTeam
);

module.exports = router;