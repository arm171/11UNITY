// ============================================
// CONFIG
// Application configuration
// ============================================

const CONFIG = {
    API_URL: 'http://localhost:3000/api',

    ENDPOINTS: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        TOURNAMENTS: '/tournaments',
        TOURNAMENT_BY_ID: '/tournaments/:id',
        TEAMS: '/teams',
        TEAM_BY_ID: '/teams/:id',
        MATCHES: '/matches',
        MATCH_BY_ID: '/matches/:id',
    },

    STORAGE: {
        TOKEN: '11unity_token',
        USER: '11unity_user',
    },

    ROLES: {
        PLAYER: 'player',
        COACH: 'coach',
        ORGANIZER: 'organizer',
    },

    TOURNAMENT_TYPES: {
        LEAGUE: 'league',
        PLAYOFF: 'playoff',
        GROUP_PLAYOFF: 'group_playoff',
    },

    TOURNAMENT_STATUS: {
        UPCOMING: 'upcoming',
        ACTIVE: 'active',
        FINISHED: 'finished',
    },

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

window.CONFIG = CONFIG;