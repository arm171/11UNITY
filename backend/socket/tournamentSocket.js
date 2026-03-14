/**
 * TOURNAMENT SOCKET
 * Tournament-related socket event emitters
 */

const { emitToTournament } = require('./socketHandler');
const db = require('../config/database');

/**
 * Emit match score update to all clients viewing the tournament
 * @param {number} tournamentId - Tournament ID
 * @param {Object} matchData - Updated match data
 */
const emitScoreUpdate = (tournamentId, matchData) => {
    emitToTournament(tournamentId, 'match:score-update', {
        matchId: matchData.id,
        team1Score: matchData.team1_score,
        team2Score: matchData.team2_score,
        status: matchData.status,
        timestamp: new Date().toISOString()
    });
};

/**
 * Emit match event (goal, card) to all clients viewing the tournament
 * @param {number} tournamentId - Tournament ID
 * @param {Object} eventData - Event data
 */
const emitMatchEvent = (tournamentId, eventData) => {
    emitToTournament(tournamentId, 'match:event', {
        matchId: eventData.match_id,
        eventType: eventData.event_type,
        playerId: eventData.player_id,
        playerName: eventData.player_name,
        teamId: eventData.team_id,
        teamName: eventData.team_name,
        minute: eventData.minute,
        timestamp: new Date().toISOString()
    });
};

/**
 * Emit standings update to all clients viewing the tournament
 * @param {number} tournamentId - Tournament ID
 */
const emitStandingsUpdate = async (tournamentId) => {
    try {
        const [standings] = await db.promise().query(`
            SELECT
                s.*,
                t.name as team_name,
                t.logo as team_logo,
                t.logo_color as team_color
            FROM standings s
            INNER JOIN teams t ON s.team_id = t.id
            WHERE s.tournament_id = ?
            ORDER BY s.points DESC, s.goal_difference DESC, s.goals_for DESC
        `, [tournamentId]);

        emitToTournament(tournamentId, 'standings:update', {
            standings,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error emitting standings update:', error);
    }
};

/**
 * Emit player statistics update to all clients viewing the tournament
 * @param {number} tournamentId - Tournament ID
 */
const emitStatisticsUpdate = async (tournamentId) => {
    try {
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
            ORDER BY ps.goals DESC, ps.assists DESC
        `, [tournamentId]);

        emitToTournament(tournamentId, 'statistics:update', {
            statistics,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error emitting statistics update:', error);
    }
};

module.exports = {
    emitScoreUpdate,
    emitMatchEvent,
    emitStandingsUpdate,
    emitStatisticsUpdate
};
