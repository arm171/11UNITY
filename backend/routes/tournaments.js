const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');
const { verifyToken, checkRole } = require('../middleware/auth');

// ========== PUBLIC ROUTES ==========

// Get all tournaments
router.get('/', tournamentController.getTournaments);

// ========== ORGANIZER ROUTES ==========

// Create tournament (organizer only)
router.post(
    '/',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.createTournament
);

// Preview fixtures (organizer only)
router.post(
    '/:id/fixtures/preview',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.previewFixtures
);

// Generate fixtures (organizer only)
router.post(
    '/:id/fixtures/generate',
    verifyToken,
    checkRole(['organizer']),
    tournamentController.generateFixtures
);

// ========== COACH ROUTES ==========

// Join tournament (coach only)
router.post(
    '/:id/join',
    verifyToken,
    checkRole(['coach']),
    tournamentController.joinTournament
);

// Check if user joined (coach only)
router.get(
    '/:id/check-joined',
    verifyToken,
    checkRole(['coach']),
    tournamentController.checkUserJoined
);

module.exports = router;