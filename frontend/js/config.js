/* ==============================================
   CONFIG - Конфигурация приложения
   ============================================== */

const CONFIG = {
    // URL Backend API
    API_URL: 'http://localhost:3000/api',
    
    // Endpoints
    ENDPOINTS: {
        // Auth
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        
        // Tournaments
        TOURNAMENTS: '/tournaments',
        TOURNAMENT_BY_ID: '/tournaments/:id',
        
        // Teams
        TEAMS: '/teams',
        TEAM_BY_ID: '/teams/:id',
        
        // Matches (будем добавлять позже)
        MATCHES: '/matches',
        MATCH_BY_ID: '/matches/:id',
    },
    
    // LocalStorage keys
    STORAGE: {
        TOKEN: '11unity_token',
        USER: '11unity_user',
    },
    
    // User roles
    ROLES: {
        PLAYER: 'player',
        COACH: 'coach',
        ORGANIZER: 'organizer',
    },
    
    // Tournament types
    TOURNAMENT_TYPES: {
        LEAGUE: 'league',
        PLAYOFF: 'playoff',
        GROUP_PLAYOFF: 'group_playoff',
    },
    
    // Tournament statuses
    TOURNAMENT_STATUS: {
        UPCOMING: 'upcoming',
        ACTIVE: 'active',
        FINISHED: 'finished',
    },
    
    // Messages
    MESSAGES: {
        SUCCESS: {
            LOGIN: 'Successfully logged in!',
            REGISTER: 'Account created successfully!',
            TOURNAMENT_CREATED: 'Tournament created successfully!',
            TEAM_CREATED: 'Team created successfully!',
            LOGOUT: 'Logged out successfully!',
        },
        ERROR: {
            LOGIN_FAILED: 'Login failed. Please check your credentials.',
            REGISTER_FAILED: 'Registration failed. Please try again.',
            LOAD_TOURNAMENTS: 'Failed to load tournaments.',
            LOAD_TEAMS: 'Failed to load teams.',
            CREATE_TOURNAMENT: 'Failed to create tournament.',
            CREATE_TEAM: 'Failed to create team.',
            UNAUTHORIZED: 'Please login to continue.',
            NETWORK_ERROR: 'Network error. Please check your connection.',
        },
    },
};

// Экспортируем для использования в других файлах
window.CONFIG = CONFIG;

console.log('✅ Config loaded:', CONFIG.API_URL);