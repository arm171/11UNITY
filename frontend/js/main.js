// ============================================
// MAIN
// Application entry point
// ============================================

document.addEventListener('DOMContentLoaded', function() {

    // Check dependencies
    if (!window.CONFIG) {
        console.error('CONFIG not loaded!');
        return;
    }

    if (!window.I18n) {
        console.error('I18n not loaded!');
        return;
    }

    if (!window.API) {
        console.error('API not loaded!');
        return;
    }

    if (!window.UI) {
        console.error('UI not loaded!');
        return;
    }

    if (!window.Auth) {
        console.error('Auth not loaded!');
        return;
    }

    if (!window.Tournaments) {
        console.error('Tournaments not loaded!');
        return;
    }

    if (!window.Teams) {
        console.error('Teams not loaded!');
        return;
    }

    if (!window.Matches) {
        console.error('Matches not loaded!');
        return;
    }

    if (!window.Statistics) {
        console.error('Statistics not loaded!');
        return;
    }

    if (!window.WebSocketManager) {
        console.error('WebSocketManager not loaded!');
        return;
    }

    // Initialize modules
    try {
        // Initialize I18n first (before UI to translate static content)
        I18n.init();

        UI.init();
        Auth.init();
        Tournaments.init();
        Teams.init();
        Matches.init();
        Statistics.init();
        WebSocketManager.init();

        // Welcome message for first-time visitors
        const hasVisited = localStorage.getItem('11unity_visited');
        if (!hasVisited) {
            setTimeout(() => {
                UI.showNotification(I18n.t('welcome'), 'success', 4000);
                localStorage.setItem('11unity_visited', 'true');
            }, 1000);
        }

    } catch (error) {
        console.error('Initialization failed:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }

});

// Listen for language changes to refresh dynamic content
window.addEventListener('languageChanged', function() {
    // Re-render dynamic content when language changes
    if (window.Tournaments && Tournaments.render) {
        Tournaments.render();
    }
    if (window.Teams && Teams.render) {
        Teams.render();
    }
    if (window.Matches && Matches.render) {
        Matches.render();
    }
    if (window.Statistics && Statistics.render) {
        Statistics.render();
    }
});

// Global error handlers
window.addEventListener('error', function(e) {
    console.error('Global Error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
});

// Debug utilities
window.debug = {
    config: CONFIG,
    api: API,
    ui: UI,
    auth: Auth,
    tournaments: Tournaments,
    teams: Teams,
    ws: WebSocketManager,

    login: (email, password) => {
        return API.login({ email, password });
    },

    logout: () => {
        API.logout();
        Auth.updateUI();
        UI.showNotification('Logged out', 'info');
    },

    getUser: () => {
        return API.getUser();
    },

    getTournaments: () => {
        return Tournaments.tournaments;
    },

    getTeams: () => {
        return Teams.teams;
    },

    clearStorage: () => {
        localStorage.clear();
        location.reload();
    },
};
