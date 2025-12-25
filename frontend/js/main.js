/* ==============================================
   MAIN - Точка входа приложения
   ============================================== */

// ========== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ==========

document.addEventListener('DOMContentLoaded', function() {
    
    console.log('🚀 11UNITY Application Starting...');
    console.log('═══════════════════════════════════════');
    
    // ========== ПРОВЕРКА ЗАВИСИМОСТЕЙ ==========
    
    if (!window.CONFIG) {
        console.error('❌ CONFIG not loaded!');
        return;
    }
    
    if (!window.API) {
        console.error('❌ API not loaded!');
        return;
    }
    
    if (!window.UI) {
        console.error('❌ UI not loaded!');
        return;
    }
    
    if (!window.Auth) {
        console.error('❌ Auth not loaded!');
        return;
    }
    
    if (!window.Tournaments) {
        console.error('❌ Tournaments not loaded!');
        return;
    }
    
    if (!window.Teams) {
        console.error('❌ Teams not loaded!');
        return;
    }
    
    console.log('✅ All dependencies loaded');
    console.log('═══════════════════════════════════════');
    
    // ========== ИНИЦИАЛИЗАЦИЯ МОДУЛЕЙ ==========
    
    try {
        // 1. UI Module (навигация, уведомления)
        UI.init();
        
        // 2. Auth Module (авторизация, модалки входа)
        Auth.init();
        
        // 3. Tournaments Module (турниры)
        Tournaments.init();
        
        // 4. Teams Module (команды)
        Teams.init();
        
        console.log('═══════════════════════════════════════');
        console.log('✅ All modules initialized successfully!');
        console.log('═══════════════════════════════════════');
        
        // ========== ПРОВЕРКА СОСТОЯНИЯ ПОЛЬЗОВАТЕЛЯ ==========
        
        if (API.isAuthenticated()) {
            const user = API.getUser();
            console.log('👤 User logged in:', user.name, `(${user.role})`);
        } else {
            console.log('👋 Guest mode - not logged in');
        }
        
        console.log('═══════════════════════════════════════');
        console.log('🎉 11UNITY Ready!');
        console.log('═══════════════════════════════════════');
        
        // ========== WELCOME MESSAGE ==========
        
        // Показываем приветственное сообщение только для новых пользователей
        const hasVisited = localStorage.getItem('11unity_visited');
        if (!hasVisited) {
            setTimeout(() => {
                UI.showNotification('Welcome to 11UNITY! 🎉', 'success', 4000);
                localStorage.setItem('11unity_visited', 'true');
            }, 1000);
        }
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        alert('Failed to initialize application. Please refresh the page.');
    }
    
});

// ========== ГЛОБАЛЬНАЯ ОБРАБОТКА ОШИБОК ==========

window.addEventListener('error', function(e) {
    console.error('🚨 Global Error:', e.error);
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('🚨 Unhandled Promise Rejection:', e.reason);
});

// ========== УТИЛИТЫ ДЛЯ ОТЛАДКИ ==========

// Доступ к модулям из консоли браузера
window.debug = {
    config: CONFIG,
    api: API,
    ui: UI,
    auth: Auth,
    tournaments: Tournaments,
    teams: Teams,
    
    // Быстрые команды для отладки
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
        console.log('✅ LocalStorage cleared');
        location.reload();
    },
    
    help: () => {
        console.log(`
═══════════════════════════════════════
11UNITY DEBUG COMMANDS
═══════════════════════════════════════

debug.login(email, password)  - Login user
debug.logout()                - Logout user
debug.getUser()               - Get current user
debug.getTournaments()        - Get all tournaments
debug.getTeams()              - Get all teams
debug.clearStorage()          - Clear localStorage & reload

debug.config                  - View config
debug.api                     - Access API module
debug.ui                      - Access UI module
debug.auth                    - Access Auth module
debug.tournaments             - Access Tournaments module
debug.teams                   - Access Teams module

═══════════════════════════════════════
        `);
    }
};

console.log('💡 Debug mode enabled! Type "debug.help()" in console for commands.');