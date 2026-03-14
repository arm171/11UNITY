// ============================================
// API MODULE
// All backend API requests
// ============================================

const API = {

    // Helper functions
    getToken() {
        return localStorage.getItem(CONFIG.STORAGE.TOKEN);
    },

    setToken(token) {
        localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
    },

    removeToken() {
        localStorage.removeItem(CONFIG.STORAGE.TOKEN);
    },

    getUser() {
        const userStr = localStorage.getItem(CONFIG.STORAGE.USER);
        return userStr ? JSON.parse(userStr) : null;
    },

    setUser(user) {
        localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
    },

    removeUser() {
        localStorage.removeItem(CONFIG.STORAGE.USER);
    },

    isAuthenticated() {
        const token = this.getToken();
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.exp * 1000 > Date.now();
        } catch (e) {
            return false;
        }
    },

    // HTTP request
    async request(endpoint, options = {}) {
        const url = CONFIG.API_URL + endpoint;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            ...options,
            headers,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Request failed');
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    async register(userData) {
        const response = await this.request(CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (response.token) {
            this.setToken(response.token);
            this.setUser(response.user);
        }

        return response;
    },

    async login(credentials) {
        const response = await this.request(CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });

        if (response.token) {
            this.setToken(response.token);
            this.setUser(response.user);
        }

        return response;
    },

    logout() {
        this.removeToken();
        this.removeUser();
    },

    // Tournament endpoints
    async getTournaments() {
        return await this.request(CONFIG.ENDPOINTS.TOURNAMENTS);
    },

    async getTournamentById(id) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
        return await this.request(endpoint);
    },

    async createTournament(tournamentData) {
        return await this.request(CONFIG.ENDPOINTS.TOURNAMENTS, {
            method: 'POST',
            body: JSON.stringify(tournamentData),
        });
    },

    async joinTournament(tournamentId) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', tournamentId) + '/join';
        return await this.request(endpoint, {
            method: 'POST'
        });
    },

    async checkTournamentJoined(tournamentId) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', tournamentId) + '/check-joined';
        return await this.request(endpoint);
    },

    async leaveTournament(tournamentId) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', tournamentId) + '/leave';
        return await this.request(endpoint, {
            method: 'POST'
        });
    },

    async updateTournament(id, tournamentData) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(tournamentData),
        });
    },

    async deleteTournament(id) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
        return await this.request(endpoint, {
            method: 'DELETE',
        });
    },

    // Team endpoints
    async getTeams() {
        return await this.request(CONFIG.ENDPOINTS.TEAMS);
    },

    async getTeamById(id) {
        const endpoint = CONFIG.ENDPOINTS.TEAM_BY_ID.replace(':id', id);
        return await this.request(endpoint);
    },

    async createTeam(teamData) {
        return await this.request(CONFIG.ENDPOINTS.TEAMS, {
            method: 'POST',
            body: JSON.stringify(teamData),
        });
    },

    async updateTeam(id, teamData) {
        const endpoint = CONFIG.ENDPOINTS.TEAM_BY_ID.replace(':id', id);
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(teamData),
        });
    },

    async deleteTeam(id) {
        const endpoint = CONFIG.ENDPOINTS.TEAM_BY_ID.replace(':id', id);
        return await this.request(endpoint, {
            method: 'DELETE',
        });
    },

    // Leave team (player)
    async leaveTeam() {
        return await this.request('/teams/leave', {
            method: 'POST',
        });
    },

    // Player management endpoints
    async searchPlayers(teamId, query) {
        const endpoint = `/teams/${teamId}/players/search?query=${encodeURIComponent(query)}`;
        return await this.request(endpoint);
    },

    async addPlayerToTeam(teamId, playerData) {
        const endpoint = `/teams/${teamId}/players`;
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(playerData),
        });
    },

    async removePlayerFromTeam(teamId, playerId) {
        const endpoint = `/teams/${teamId}/players/${playerId}`;
        return await this.request(endpoint, {
            method: 'DELETE',
        });
    },

    // Match endpoints
    async getMatches() {
        return await this.request(CONFIG.ENDPOINTS.MATCHES);
    },

    async getTournamentMatches(tournamentId) {
        const endpoint = `/tournaments/${tournamentId}/matches`;
        return await this.request(endpoint);
    },

    async getMatchDetails(tournamentId, matchId) {
        const endpoint = `/tournaments/${tournamentId}/matches/${matchId}`;
        return await this.request(endpoint);
    },

    async updateMatchResult(tournamentId, matchId, data) {
        const endpoint = `/tournaments/${tournamentId}/matches/${matchId}`;
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    async addMatchEvent(tournamentId, matchId, eventData) {
        const endpoint = `/tournaments/${tournamentId}/matches/${matchId}/events`;
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    },

    async deleteMatchEvent(tournamentId, matchId, eventId) {
        const endpoint = `/tournaments/${tournamentId}/matches/${matchId}/events/${eventId}`;
        return await this.request(endpoint, {
            method: 'DELETE',
        });
    },

    // Standings endpoints
    async getStandings(tournamentId) {
        const endpoint = `/tournaments/${tournamentId}/standings`;
        return await this.request(endpoint);
    },

    // Player statistics endpoints
    async getPlayerStatistics(tournamentId) {
        const endpoint = `/tournaments/${tournamentId}/statistics`;
        return await this.request(endpoint);
    },

    // Profile update
    async updateProfile(profileData) {
        return await this.request(CONFIG.ENDPOINTS.PROFILE_UPDATE, {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
    },

    // Global statistics
    async getStatistics() {
        return await this.request(CONFIG.ENDPOINTS.STATISTICS);
    },

};

window.API = API;
