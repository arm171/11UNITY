// ============================================
// WEBSOCKET MODULE
// Real-time communication with Socket.IO
// ============================================

const WebSocketManager = {

    socket: null,
    currentTournamentId: null,
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,

    /**
     * Initialize WebSocket connection
     */
    init() {
        this.connect();
        this.setupEventHandlers();
    },

    /**
     * Connect to WebSocket server
     */
    connect() {
        const wsUrl = CONFIG.WS_URL || CONFIG.API_URL.replace('/api', '');

        this.socket = io(wsUrl, {
            auth: {
                token: API.getToken()
            },
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000
        });

        this.socket.on('connect', () => {
            this.reconnectAttempts = 0;

            // Rejoin tournament room if we were viewing one
            if (this.currentTournamentId) {
                this.joinTournament(this.currentTournamentId);
            }
        });

        this.socket.on('disconnect', () => {
        });

        this.socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            this.reconnectAttempts++;
        });
    },

    /**
     * Setup event handlers for incoming WebSocket events
     */
    setupEventHandlers() {
        // Match score update
        this.socket.on('match:score-update', (data) => {
            this.handleScoreUpdate(data);
        });

        // Match event (goal, card)
        this.socket.on('match:event', (data) => {
            this.handleMatchEvent(data);
        });

        // Standings update
        this.socket.on('standings:update', (data) => {
            this.handleStandingsUpdate(data);
        });

        // Statistics update
        this.socket.on('statistics:update', (data) => {
            this.handleStatisticsUpdate(data);
        });

    },

    /**
     * Join a tournament room to receive updates
     * @param {number} tournamentId - Tournament ID
     */
    joinTournament(tournamentId) {
        if (!this.socket || !this.socket.connected) {
            this.currentTournamentId = tournamentId;
            return;
        }

        // Leave previous tournament room if any
        if (this.currentTournamentId && this.currentTournamentId !== tournamentId) {
            this.leaveTournament(this.currentTournamentId);
        }

        this.currentTournamentId = tournamentId;
        this.socket.emit('tournament:join', tournamentId);
    },

    /**
     * Leave a tournament room
     * @param {number} tournamentId - Tournament ID
     */
    leaveTournament(tournamentId) {
        if (!this.socket || !this.socket.connected) return;

        this.socket.emit('tournament:leave', tournamentId);

        if (this.currentTournamentId === tournamentId) {
            this.currentTournamentId = null;
        }
    },

    /**
     * Handle match score update
     * @param {Object} data - Score update data
     */
    handleScoreUpdate(data) {
        // Update fixtures display if visible
        const fixtureCard = document.querySelector(
            `[data-match-id="${data.matchId}"]`
        );

        if (fixtureCard) {
            const scoreDisplay = fixtureCard.querySelector('.match-score');
            if (scoreDisplay) {
                scoreDisplay.innerHTML = `
                    <span style="color: #2ecc71; font-weight: bold; font-size: 24px;">
                        ${data.team1Score} - ${data.team2Score}
                    </span>
                `;
            }
        }

        // Update match results modal if open
        if (Tournaments.currentMatch && Tournaments.currentMatch.id == data.matchId) {
            Tournaments.currentMatch.team1_score = data.team1Score;
            Tournaments.currentMatch.team2_score = data.team2Score;
            Tournaments.currentMatch.status = data.status;
            Tournaments.updateScoreDisplay();
        }

        // Show notification
        UI.showNotification(
            I18n.t('match.scoreUpdated') || 'Match score updated!',
            'info',
            2000
        );

        // Trigger custom event for additional handling
        window.dispatchEvent(new CustomEvent('scoreUpdate', { detail: data }));
    },

    /**
     * Handle match event (goal, card)
     * @param {Object} data - Event data
     */
    handleMatchEvent(data) {
        // Show toast notification for the event
        let message;
        let notificationType = 'info';

        switch (data.eventType) {
            case 'goal':
                message = `${I18n.t('match.goal') || 'Goal'}! ${data.playerName} (${data.teamName}) ${data.minute}'`;
                notificationType = 'success';
                break;
            case 'yellow_card':
                message = `${I18n.t('match.yellowCard') || 'Yellow card'}: ${data.playerName} ${data.minute}'`;
                break;
            case 'red_card':
                message = `${I18n.t('match.redCard') || 'Red card'}: ${data.playerName} ${data.minute}'`;
                notificationType = 'error';
                break;
            default:
                message = `${data.eventType}: ${data.playerName} ${data.minute}'`;
        }

        UI.showNotification(message, notificationType, 3000);

        // Update match events list if modal is open
        if (Tournaments.currentMatch && Tournaments.currentMatch.id == data.matchId) {
            // Add event to current match events
            if (!Tournaments.currentMatch.events) {
                Tournaments.currentMatch.events = [];
            }
            Tournaments.currentMatch.events.push({
                player_name: data.playerName,
                team_name: data.teamName,
                event_type: data.eventType,
                minute: data.minute
            });
            Tournaments.loadMatchEvents();
        }

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('matchEvent', { detail: data }));
    },

    /**
     * Handle standings update
     * @param {Object} data - Standings data
     */
    handleStandingsUpdate(data) {
        // Check if standings tab is visible
        const standingsTab = document.getElementById('tournament-standings-tab');
        if (standingsTab && standingsTab.style.display !== 'none') {
            // Re-render standings with new data
            if (Tournaments.renderStandingsFromData) {
                Tournaments.renderStandingsFromData(data.standings);
            }
        }

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('standingsUpdate', { detail: data }));
    },

    /**
     * Handle statistics update
     * @param {Object} data - Statistics data
     */
    handleStatisticsUpdate(data) {
        // Check if statistics tab is visible
        const statsTab = document.getElementById('tournament-statistics-tab');
        if (statsTab && statsTab.style.display !== 'none') {
            // Re-render statistics with new data
            if (Tournaments.renderStatisticsFromData) {
                Tournaments.renderStatisticsFromData(data.statistics);
            }
        }

        // Trigger custom event
        window.dispatchEvent(new CustomEvent('statisticsUpdate', { detail: data }));
    },

    /**
     * Reconnect with new auth token (after login)
     */
    reconnect() {
        if (this.socket) {
            this.socket.auth.token = API.getToken();
            this.socket.disconnect().connect();
        }
    },

    /**
     * Disconnect WebSocket (on logout)
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
        this.currentTournamentId = null;
    }
};

window.WebSocketManager = WebSocketManager;
