/* ==============================================
   API MODULE - Все запросы к Backend
   ============================================== */

const API = {
    
    // ========== HELPER FUNCTIONS ==========
    
    /**
     * Получить токен из localStorage
     */
    getToken() {
        return localStorage.getItem(CONFIG.STORAGE.TOKEN);
    },
    
    /**
     * Сохранить токен в localStorage
     */
    setToken(token) {
        localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
    },
    
    /**
     * Удалить токен из localStorage
     */
    removeToken() {
        localStorage.removeItem(CONFIG.STORAGE.TOKEN);
    },
    
    /**
     * Получить пользователя из localStorage
     */
    getUser() {
        const userStr = localStorage.getItem(CONFIG.STORAGE.USER);
        return userStr ? JSON.parse(userStr) : null;
    },
    
    /**
     * Сохранить пользователя в localStorage
     */
    setUser(user) {
        localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));
    },
    
    /**
     * Удалить пользователя из localStorage
     */
    removeUser() {
        localStorage.removeItem(CONFIG.STORAGE.USER);
    },
    
    /**
     * Проверить авторизован ли пользователь
     */
    isAuthenticated() {
        return !!this.getToken();
    },
    
    // ========== HTTP REQUEST ==========
    
    /**
     * Базовая функция для HTTP запросов
     */
    async request(endpoint, options = {}) {
        const url = CONFIG.API_URL + endpoint;
        
        // Заголовки по умолчанию
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };
        
        // Добавляем токен если есть
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const config = {
            ...options,
            headers,
        };
        
        try {
            console.log(`📡 API Request: ${options.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            
            // Проверяем статус ответа
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Request failed');
            }
            
            const data = await response.json();
            
            console.log(`✅ API Response:`, data);
            
            return data;
            
        } catch (error) {
            console.error(`❌ API Error:`, error);
            throw error;
        }
    },
    
    // ========== AUTH ENDPOINTS ==========
    
    /**
     * Регистрация нового пользователя
     */
    async register(userData) {
        const response = await this.request(CONFIG.ENDPOINTS.REGISTER, {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        
        // Сохраняем токен и пользователя
        if (response.token) {
            this.setToken(response.token);
            this.setUser(response.user);
        }
        
        return response;
    },
    
    /**
     * Вход пользователя
     */
    async login(credentials) {
        const response = await this.request(CONFIG.ENDPOINTS.LOGIN, {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
        
        // Сохраняем токен и пользователя
        if (response.token) {
            this.setToken(response.token);
            this.setUser(response.user);
        }
        
        return response;
    },
    
    /**
     * Выход пользователя
     */
    logout() {
        this.removeToken();
        this.removeUser();
        console.log('👋 User logged out');
    },
    
    // ========== TOURNAMENT ENDPOINTS ==========
    
    /**
     * Получить все турниры
     */
    async getTournaments() {
        return await this.request(CONFIG.ENDPOINTS.TOURNAMENTS);
    },
    
    /**
     * Получить турнир по ID
     */
    async getTournamentById(id) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
        return await this.request(endpoint);
    },
    
    /**
     * Создать новый турнир
     */
    async createTournament(tournamentData) {
        return await this.request(CONFIG.ENDPOINTS.TOURNAMENTS, {
            method: 'POST',
            body: JSON.stringify(tournamentData),
        });
    },
    
    /**
     * Թիմը միանում է մրցաշարին
     */
    async joinTournament(tournamentId) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', tournamentId) + '/join';
        return await this.request(endpoint, {
            method: 'POST'
        });
    },
    
    /**
     * Ստուգել արդեն միացե՞լ է մրցաշարին
     */
    async checkTournamentJoined(tournamentId) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', tournamentId) + '/check-joined';
        return await this.request(endpoint);
    },
    
    /**
     * Обновить турнир
     */
    async updateTournament(id, tournamentData) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(tournamentData),
        });
    },
    
    /**
     * Удалить турнир
     */
    async deleteTournament(id) {
        const endpoint = CONFIG.ENDPOINTS.TOURNAMENT_BY_ID.replace(':id', id);
        return await this.request(endpoint, {
            method: 'DELETE',
        });
    },
    
    // ========== TEAM ENDPOINTS ==========
    
    /**
     * Получить все команды
     */
    async getTeams() {
        return await this.request(CONFIG.ENDPOINTS.TEAMS);
    },
    
    /**
     * Получить команду по ID
     */
    async getTeamById(id) {
        const endpoint = CONFIG.ENDPOINTS.TEAM_BY_ID.replace(':id', id);
        return await this.request(endpoint);
    },
    
    /**
     * Создать новую команду
     */
    async createTeam(teamData) {
        return await this.request(CONFIG.ENDPOINTS.TEAMS, {
            method: 'POST',
            body: JSON.stringify(teamData),
        });
    },
    
    /**
     * Обновить команду
     */
    async updateTeam(id, teamData) {
        const endpoint = CONFIG.ENDPOINTS.TEAM_BY_ID.replace(':id', id);
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(teamData),
        });
    },
    
    /**
     * Удалить команду
     */
    async deleteTeam(id) {
        const endpoint = CONFIG.ENDPOINTS.TEAM_BY_ID.replace(':id', id);
        return await this.request(endpoint, {
            method: 'DELETE',
        });
    },
    
    // ========== PLAYER MANAGEMENT ENDPOINTS ==========
    
    /**
     * Փնտրել խաղացողներ email-ով
     */
    async searchPlayers(teamId, email) {
        const endpoint = `/teams/${teamId}/players/search?email=${encodeURIComponent(email)}`;
        return await this.request(endpoint);
    },
    
    /**
     * Ավելացնել խաղացող թիմին
     */
    async addPlayerToTeam(teamId, playerData) {
        const endpoint = `/teams/${teamId}/players`;
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(playerData),
        });
    },
    
    /**
     * Հեռացնել խաղացող թիմից
     */
    async removePlayerFromTeam(teamId, playerId) {
        const endpoint = `/teams/${teamId}/players/${playerId}`;
        return await this.request(endpoint, {
            method: 'DELETE',
        });
    },
    
    // ========== MATCH ENDPOINTS ==========
    
    /**
     * Получить все матчи
     */
    async getMatches() {
        return await this.request(CONFIG.ENDPOINTS.MATCHES);
    },

    /**
     * Получить матчи турнира
     */
    async getTournamentMatches(tournamentId) {
        const endpoint = `/tournaments/${tournamentId}/matches`;
        return await this.request(endpoint);
    },
    
    /**
     * Получить детали матча (ՆՈՐ)
     */
    async getMatchDetails(tournamentId, matchId) {
        const endpoint = `/tournaments/${tournamentId}/matches/${matchId}`;
        return await this.request(endpoint);
    },
    
    /**
     * Թարմացնել խաղի արդյունքը (ՆՈՐ)
     */
    async updateMatchResult(tournamentId, matchId, data) {
        const endpoint = `/tournaments/${tournamentId}/matches/${matchId}`;
        return await this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },
    
    /**
     * Ավելացնել խաղի իրադարձություն (ՆՈՐ)
     */
    async addMatchEvent(tournamentId, matchId, eventData) {
        const endpoint = `/tournaments/${tournamentId}/matches/${matchId}/events`;
        return await this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(eventData),
        });
    },
    
};

// Экспортируем для использования
window.API = API;

console.log('✅ API Module loaded');