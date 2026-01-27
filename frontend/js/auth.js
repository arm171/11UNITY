// ============================================
// AUTH MODULE
// Authentication and registration
// ============================================

const Auth = {

    init() {
        this.createAuthModal();
        this.createProfileModal();
        this.attachEventListeners();
        this.updateUI();
    },

    createAuthModal() {
        const modalHTML = `
            <div class="modal" id="auth-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-auth-modal">&times;</button>

                    <div class="auth-tabs">
                        <button class="auth-tab active" data-tab="login">
                            <i class="fas fa-sign-in-alt"></i> <span data-i18n="auth.login">Login</span>
                        </button>
                        <button class="auth-tab" data-tab="register">
                            <i class="fas fa-user-plus"></i> <span data-i18n="auth.register">Register</span>
                        </button>
                    </div>

                    <div class="auth-form-container active" id="login-form-container">
                        <form id="login-form">
                            <div class="form-group">
                                <label class="form-label" data-i18n="auth.email">Email</label>
                                <input
                                    type="email"
                                    class="form-input"
                                    id="login-email"
                                    data-i18n-placeholder="auth.emailPlaceholder"
                                    placeholder="your@email.com"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label" data-i18n="auth.password">Password</label>
                                <input
                                    type="password"
                                    class="form-input"
                                    id="login-password"
                                    data-i18n-placeholder="auth.passwordPlaceholder"
                                    placeholder="........"
                                    required
                                >
                            </div>

                            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px;">
                                <span class="btn-text" data-i18n="auth.login">Login</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </form>
                    </div>

                    <div class="auth-form-container" id="register-form-container">
                        <form id="register-form">
                            <div class="form-group">
                                <label class="form-label" data-i18n="auth.fullName">Full Name</label>
                                <input
                                    type="text"
                                    class="form-input"
                                    id="register-name"
                                    data-i18n-placeholder="auth.namePlaceholder"
                                    placeholder="John Doe"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label" data-i18n="auth.email">Email</label>
                                <input
                                    type="email"
                                    class="form-input"
                                    id="register-email"
                                    data-i18n-placeholder="auth.emailPlaceholder"
                                    placeholder="your@email.com"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label" data-i18n="auth.password">Password</label>
                                <input
                                    type="password"
                                    class="form-input"
                                    id="register-password"
                                    data-i18n-placeholder="auth.passwordPlaceholder"
                                    placeholder="........"
                                    required
                                    minlength="6"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label" data-i18n="auth.confirmPassword">Confirm Password</label>
                                <input
                                    type="password"
                                    class="form-input"
                                    id="register-confirm-password"
                                    data-i18n-placeholder="auth.passwordPlaceholder"
                                    placeholder="........"
                                    required
                                    minlength="6"
                                >
                                <span id="password-match-error" style="color: #e74c3c; font-size: 12px; display: none;">
                                    <i class="fas fa-exclamation-circle"></i> <span data-i18n="auth.passwordsDoNotMatch">Passwords do not match</span>
                                </span>
                            </div>

                            <div class="form-group">
                                <label class="form-label" data-i18n="auth.role">Role</label>
                                <select class="form-select" id="register-role" required>
                                    <option value="" data-i18n="auth.selectRole">Select your role</option>
                                    <option value="player" data-i18n="auth.roles.player">Player</option>
                                    <option value="coach" data-i18n="auth.roles.coach">Coach</option>
                                    <option value="organizer" data-i18n="auth.roles.organizer">Organizer</option>
                                </select>
                            </div>

                            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px;">
                                <span class="btn-text" data-i18n="auth.createAccount">Create Account</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Apply translations to dynamic content
        if (window.I18n) {
            I18n.applyTranslations();
        }
    },

    createProfileModal() {
        const modalHTML = `
            <div class="modal" id="profile-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content" style="max-width: 400px;">
                    <button class="modal-close" id="close-profile-modal">&times;</button>

                    <div style="text-align: center; margin-bottom: 24px;">
                        <div id="profile-avatar" style="
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            background: var(--color-primary);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 32px;
                            font-weight: bold;
                            color: white;
                            margin: 0 auto 16px;
                        ">
                            U
                        </div>
                        <h2 style="color: white; margin: 0 0 4px 0;" id="profile-user-name">User Name</h2>
                        <p style="color: #b0b0b0; margin: 0;" id="profile-user-email">user@email.com</p>
                    </div>

                    <div style="background: rgba(46, 204, 113, 0.1); border: 1px solid rgba(46, 204, 113, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #b0b0b0;" data-i18n="auth.role">Role</span>
                            <span id="profile-user-role" style="
                                background: var(--color-primary);
                                color: white;
                                padding: 4px 12px;
                                border-radius: 12px;
                                font-size: 14px;
                                font-weight: 600;
                            ">Player</span>
                        </div>
                    </div>

                    <!-- Language Selector -->
                    <div class="form-group" style="margin-bottom: 24px;">
                        <label class="form-label" data-i18n="profile.language">Language</label>
                        <select class="form-select" id="profile-language-select">
                            <option value="en">English</option>
                            <option value="ru">Русский</option>
                            <option value="hy">Հայերdelays</option>
                            <option value="ge">ქართული</option>
                        </select>
                    </div>

                    <button class="btn btn-secondary" style="width: 100%;" id="profile-logout-btn">
                        <i class="fas fa-sign-out-alt"></i> <span data-i18n="auth.logout">Logout</span>
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Apply translations
        if (window.I18n) {
            I18n.applyTranslations();
        }
    },

    attachEventListeners() {
        const getStartedBtn = document.getElementById('get-started-btn');
        if (getStartedBtn) {
            getStartedBtn.addEventListener('click', () => this.openAuthModal('login'));
        }

        const heroCTA = document.getElementById('hero-cta');
        if (heroCTA) {
            heroCTA.addEventListener('click', () => this.openAuthModal('login'));
        }

        document.getElementById('close-auth-modal').addEventListener('click', () => this.closeAuthModal());
        document.querySelector('#auth-modal .modal-overlay').addEventListener('click', () => this.closeAuthModal());

        // Profile modal events
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.openProfileModal());
        }

        document.getElementById('close-profile-modal')?.addEventListener('click', () => this.closeProfileModal());
        document.querySelector('#profile-modal .modal-overlay')?.addEventListener('click', () => this.closeProfileModal());
        document.getElementById('profile-logout-btn')?.addEventListener('click', () => this.logout());

        // Language selector in profile
        const languageSelect = document.getElementById('profile-language-select');
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => {
                if (window.I18n) {
                    I18n.setLanguage(e.target.value);
                }
            });
        }

        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        const confirmPassword = document.getElementById('register-confirm-password');
        const password = document.getElementById('register-password');

        if (confirmPassword && password) {
            confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
            password.addEventListener('input', () => this.validatePasswordMatch());
        }

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAuthModal();
            }
        });
    },

    switchTab(tabName) {
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });

        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.auth-form-container').forEach(container => {
            container.classList.remove('active');
        });

        if (tabName === 'login') {
            document.getElementById('login-form-container').classList.add('active');
        } else {
            document.getElementById('register-form-container').classList.add('active');
        }
    },

    validatePasswordMatch() {
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-confirm-password').value;
        const errorMsg = document.getElementById('password-match-error');

        if (confirmPassword.length === 0) {
            errorMsg.style.display = 'none';
            return true;
        }

        if (password !== confirmPassword) {
            errorMsg.style.display = 'block';
            return false;
        } else {
            errorMsg.style.display = 'none';
            return true;
        }
    },

    openAuthModal(tab = 'login') {
        const modal = document.getElementById('auth-modal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.switchTab(tab);
    },

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        document.getElementById('login-form').reset();
        document.getElementById('register-form').reset();
        document.getElementById('password-match-error').style.display = 'none';
    },

    openProfileModal() {
        const user = API.getUser();
        if (!user) return;

        // Update profile info
        document.getElementById('profile-user-name').textContent = user.name;
        document.getElementById('profile-user-email').textContent = user.email;

        // Set avatar initials
        const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        document.getElementById('profile-avatar').textContent = initials;

        // Set role with translation
        const roleKey = `auth.roles.${user.role}`;
        document.getElementById('profile-user-role').textContent = I18n.t(roleKey);

        // Set current language
        const currentLang = I18n.getCurrentLanguage ? I18n.getCurrentLanguage() : 'en';
        document.getElementById('profile-language-select').value = currentLang;

        UI.openModal('profile-modal');
    },

    closeProfileModal() {
        UI.closeModal('profile-modal');
    },

    async handleLogin(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner');

        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        submitBtn.disabled = true;

        try {
            const credentials = {
                email: document.getElementById('login-email').value.trim(),
                password: document.getElementById('login-password').value,
            };

            const response = await API.login(credentials);

            UI.showNotification(I18n.t('messages.success.login'), 'success');
            this.closeAuthModal();
            this.updateUI();

            if (window.Tournaments) Tournaments.load();
            if (window.Teams) Teams.load();

        } catch (error) {
            console.error('Login failed:', error);
            UI.showNotification(error.message || I18n.t('messages.error.loginFailed'), 'error');
        } finally {
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    },

    async handleRegister(e) {
        e.preventDefault();

        if (!this.validatePasswordMatch()) {
            UI.showNotification(I18n.t('auth.passwordsDoNotMatch'), 'error');
            return;
        }

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const spinner = submitBtn.querySelector('.spinner');

        btnText.style.display = 'none';
        spinner.style.display = 'inline-block';
        submitBtn.disabled = true;

        try {
            const userData = {
                name: document.getElementById('register-name').value.trim(),
                email: document.getElementById('register-email').value.trim(),
                password: document.getElementById('register-password').value,
                role: document.getElementById('register-role').value,
            };

            const response = await API.register(userData);

            UI.showNotification(I18n.t('messages.success.register'), 'success');
            this.closeAuthModal();
            this.updateUI();

            if (window.Tournaments) Tournaments.load();
            if (window.Teams) Teams.load();

        } catch (error) {
            console.error('Registration failed:', error);
            UI.showNotification(error.message || I18n.t('messages.error.registerFailed'), 'error');
        } finally {
            btnText.style.display = 'inline-block';
            spinner.style.display = 'none';
            submitBtn.disabled = false;
        }
    },

    logout() {
        if (confirm(I18n.t('common.confirmLogout'))) {
            API.logout();
            this.closeProfileModal();
            UI.showNotification(I18n.t('messages.success.logout'), 'success');
            this.updateUI();

            if (window.Tournaments) Tournaments.load();
            if (window.Teams) Teams.load();
        }
    },

    updateUI() {
        const getStartedBtn = document.getElementById('get-started-btn');
        const profileBtn = document.getElementById('profile-btn');
        const createTournamentBtn = document.getElementById('create-tournament-btn');
        const createTeamBtn = document.getElementById('create-team-btn');

        if (API.isAuthenticated()) {
            const user = API.getUser();

            if (getStartedBtn) getStartedBtn.classList.remove('show');
            if (profileBtn) {
                profileBtn.classList.add('show');
            }

            if (user.role === 'organizer' && createTournamentBtn) {
                createTournamentBtn.style.display = 'inline-flex';
            }

            if (user.role === 'coach' && createTeamBtn) {
                createTeamBtn.style.display = 'inline-flex';
            }

        } else {
            if (getStartedBtn) getStartedBtn.classList.add('show');
            if (profileBtn) profileBtn.classList.remove('show');

            if (createTournamentBtn) createTournamentBtn.style.display = 'none';
            if (createTeamBtn) createTeamBtn.style.display = 'none';
        }
    },

};

window.Auth = Auth;
