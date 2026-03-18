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
router.get('/:id/standings', tournamentController.getStandings);
router.get('/:id/statistics', tournamentController.getPlayerStatistics);
router.get('/:tournamentId/matches/:matchId', tournamentController.getMatchDetails);

// Organizer-only routes
router.post('/',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.createTournament
);

router.put('/:id',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.updateTournament
);

router.delete('/:id',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.deleteTournament
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

router.delete('/:tournamentId/matches/:matchId/events/:eventId',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.deleteMatchEvent
);

// Coach-only routes
router.post('/:id/join',
    verifyToken,
    checkRole(['coach']),
    tournamentController.joinTournament
);

router.post('/:id/leave',
    verifyToken,
    checkRole(['coach']),
    tournamentController.leaveTournament
);

router.get('/:id/check-joined',
    verifyToken,
    checkRole(['coach']),
    tournamentController.checkUserJoined
);

// Organizer team approval routes
router.get('/:id/pending-teams',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.getPendingTeams
);

router.post('/:id/teams/:teamId/approve',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.approveTeam
);

router.post('/:id/teams/:teamId/reject',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.rejectTeam
);


module.exports = router;
