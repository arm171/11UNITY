// ============================================
// MATCHES ROUTES
// ============================================

const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

// Get all matches (with optional filters)
router.get('/', tournamentController.getAllMatches);

module.exports = router;
