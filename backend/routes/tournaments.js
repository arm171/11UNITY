// ============================================
// TOURNAMENT ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { verifyToken, checkRole } = require('../middleware/auth');

// Public routes
router.get('/', tournamentController.getTournaments);
router.get('/:id/matches', tournamentController.getTournamentMatches);
router.get('/:tournamentId/matches/:matchId', tournamentController.getMatchDetails);

// Organizer-only routes
router.post('/',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.createTournament
);

router.post('/:id/fixtures/preview',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.previewFixtures
);

router.post('/:id/fixtures/generate',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.generateFixtures
);

router.put('/:tournamentId/matches/:matchId',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.updateMatchResult
);

router.post('/:tournamentId/matches/:matchId/events',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.addMatchEvent
);

// Coach-only routes
router.post('/:id/join',
    verifyToken,
    checkRole(['coach']),
    tournamentController.joinTournament
);

router.get('/:id/check-joined',
    verifyToken,
    checkRole(['coach']),
    tournamentController.checkUserJoined
);

module.exports = router;