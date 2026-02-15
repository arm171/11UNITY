// ============================================
// CONFIG
// Application configuration
// ============================================

const CONFIG = {
    API_URL: 'http://localhost:3000/api',
    WS_URL: 'http://localhost:3000',

    ENDPOINTS: {
        REGISTER: '/auth/register',
        LOGIN: '/auth/login',
        TOURNAMENTS: '/tournaments',
        TOURNAMENT_BY_ID: '/tournaments/:id',
        TEAMS: '/teams',
        TEAM_BY_ID: '/teams/:id',
        MATCHES: '/matches',
        MATCH_BY_ID: '/matches/:id',
        STATISTICS: '/statistics',
        PROFILE_STATS: '/profile/stats',
        PROFILE_UPDATE: '/profile/update',
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

    // MESSAGES moved to I18n - use I18n.t('messages.success.login') etc.
};

window.CONFIG = CONFIG;