// ============================================
// TEAM ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
router.get('/', teamController.getTeams);
router.get('/:id', teamController.getTeamById);

// Coach-only routes
router.post('/',
    verifyToken,
    checkRole('coach'),
    teamController.createTeam
);

router.put('/:id',
    verifyToken,
    checkRole('coach'),
    teamController.updateTeam
);

router.delete('/:id',
    verifyToken,
    checkRole('coach'),
    teamController.deleteTeam
);

// Player management routes (coach)
router.get('/:teamId/players/search',
    verifyToken,
    checkRole('coach'),
    teamController.searchPlayers
);

router.post('/:teamId/players',
    verifyToken,
    checkRole('coach'),
    teamController.addPlayerToTeam
);

router.delete('/:teamId/players/:playerId',
    verifyToken,
    checkRole('coach'),
    teamController.removePlayerFromTeam
);

// Player leaves team
router.post('/leave',
    verifyToken,
    checkRole('player'),
    teamController.leaveTeam
);

module.exports = router;
