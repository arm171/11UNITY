// ============================================
// AUTH MODULE
// Authentication and registration
// ============================================

// XSS protection: escape user-provided data before inserting into HTML
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Opens the user's webmail in a new tab based on their email domain,
 * then removes the verification notice popup.
 */
function openMailAndClose(btn, email) {
    const domain = email.split('@')[1] || '';
    const mailUrls = {
        'gmail.com':     'https://mail.google.com',
        'mail.ru':       'https://mail.ru',
        'inbox.ru':      'https://mail.ru',
        'list.ru':       'https://mail.ru',
        'bk.ru':         'https://mail.ru',
        'yandex.ru':     'https://mail.yandex.ru',
        'ya.ru':         'https://mail.yandex.ru',
        'outlook.com':   'https://outlook.live.com',
        'hotmail.com':   'https://outlook.live.com',
        'yahoo.com':     'https://mail.yahoo.com',
    };

    const url = mailUrls[domain];
    if (url) window.open(url, '_blank');

    btn.parentElement.remove();
}

const Auth = {

    init() {
        this.createAuthModal();
        this.setupLanguageSwitcher();
        this.setupFooterYear();
        this.attachEventListeners();
        this.setupLanguageChangeListener();
        this.handleVerificationRedirect();
        this.updateUI();
    },


    /**
     * After the user clicks the verification link in their email,
     * the server redirects them to:
     *   http://localhost:5500/?auth_token=JWT&auth_user=JSON
     *
     * This method picks up those URL params, saves them to localStorage
     * (auto-login), cleans the URL, and shows a welcome message.
     */
    handleVerificationRedirect() {
        const params = new URLSearchParams(window.location.search);

        // Handle password reset link
        const resetToken = params.get('reset_token');
        if (resetToken) {
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => this.openResetPasswordModal(resetToken), 300);
            return;
        }

        const token = params.get('auth_token');
        const userRaw = params.get('auth_user');

        if (!token || !userRaw) return;

        try {
            const user = JSON.parse(decodeURIComponent(userRaw));

            localStorage.setItem(CONFIG.STORAGE.TOKEN, token);
            localStorage.setItem(CONFIG.STORAGE.USER, JSON.stringify(user));

            window.history.replaceState({}, document.title, window.location.pathname);

            setTimeout(() => {
                UI.showNotification(`Email verified! Welcome, ${user.name}!`, 'success');
            }, 300);

        } catch (e) {
            console.error('Failed to parse verification redirect params:', e);
        }
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

                            <div style="text-align:center; margin-top:16px;">
                                <a href="#" id="forgot-password-link" style="color:#2ecc71;font-size:14px;text-decoration:none;" data-i18n="auth.forgotPassword">Forgot password?</a>
                            </div>
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

        if (window.I18n) {
            I18n.applyTranslations();
        }
    },

    setupLanguageSwitcher() {
        const langBtn = document.getElementById('lang-btn');
        const langDropdown = document.getElementById('lang-dropdown');

        if (!langBtn || !langDropdown) return;

        // Toggle dropdown
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        // Language option click
        langDropdown.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const lang = e.target.getAttribute('data-lang');
                if (window.I18n) {
                    I18n.setLanguage(lang);
                }
                langDropdown.classList.remove('active');
            });
        });

        // Close dropdown on outside click
        document.addEventListener('click', () => {
            langDropdown.classList.remove('active');
        });
    },

    setupFooterYear() {
        const yearEl = document.getElementById('footer-year');
        if (yearEl) {
            yearEl.textContent = new Date().getFullYear();
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

        // Profile button scrolls to home section (where profile dashboard is)
        const profileBtn = document.getElementById('profile-btn');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => {
                const homeSection = document.getElementById('home');
                if (homeSection) {
                    homeSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }

        // Logout button in profile section
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Auth tabs
        const tabs = document.querySelectorAll('.auth-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.getAttribute('data-tab');
                this.switchTab(tabName);
            });
        });

        document.getElementById('login-form').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('register-form').addEventListener('submit', (e) => this.handleRegister(e));

        document.getElementById('forgot-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('login-email');
            const email = emailInput ? emailInput.value.trim() : '';
            this.closeAuthModal();
            if (email) {
                this.sendForgotPasswordRequest(email);
            } else {
                this.openForgotPasswordModal();
            }
        });

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

    updateProfileSection() {
        const heroSection = document.getElementById('hero-section');
        const profileSection = document.getElementById('profile-section');

        if (!heroSection || !profileSection) return;

        if (API.isAuthenticated()) {
            const user = API.getUser();
            heroSection.style.display = 'none';
            profileSection.style.display = 'block';

            // Update profile info
            const nameEl = document.getElementById('profile-user-name');
            const emailEl = document.getElementById('profile-user-email');
            const roleEl = document.getElementById('profile-user-role');
            const avatarEl = document.getElementById('profile-avatar');

            if (nameEl) nameEl.textContent = user.name;
            if (emailEl) emailEl.textContent = user.email;
            if (roleEl) {
                const roleKey = `auth.roles.${user.role}`;
                roleEl.textContent = window.I18n ? I18n.t(roleKey) : user.role;
            }
            if (avatarEl) {
                const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                avatarEl.innerHTML = `<span>${initials}</span>`;
            }

            // Update profile stats based on role
            this.updateProfileStats(user);
        } else {
            heroSection.style.display = 'block';
            profileSection.style.display = 'none';
        }
    },

    async updateProfileStats(user) {
        const statsContainer = document.getElementById('profile-stats');
        if (!statsContainer) return;

        const t = (key, fallback) => window.I18n ? I18n.t(key) : fallback;

        try {
            const data = await API.request(CONFIG.ENDPOINTS.PROFILE_STATS);

            if (data.role === 'player') {
                this.renderPlayerProfile(statsContainer, data, t);
            } else if (data.role === 'coach') {
                this.renderCoachProfile(statsContainer, data, t);
            } else if (data.role === 'organizer') {
                this.renderOrganizerProfile(statsContainer, data, t);
            } else if (data.role === 'admin') {
                this.renderAdminProfile(statsContainer, data, t);
            }
        } catch (error) {
            console.error('Failed to load profile stats:', error);
            statsContainer.innerHTML = '';
        }
    },

    renderPlayerProfile(container, data, t) {
        const { team, stats, recentMatches } = data;

        if (!team) {
            container.innerHTML = `<p class="profile-no-data">${t('profile.noTeam', 'No team yet')}</p>`;
            return;
        }

        // Team info section
        let html = `
            <div class="profile-section-label">
                <i class="fas fa-shield-alt"></i> ${t('profile.myTeam', 'My Team')}
            </div>
            <div class="profile-stat-cards">
                <div class="profile-stat-card">
                    <i class="fas fa-users"></i>
                    <div>
                        <strong>${escapeHtml(team.team_name)}</strong>
                        <span>${t('profile.myTeam', 'Team')}</span>
                    </div>
                </div>
                ${team.position ? `
                <div class="profile-stat-card">
                    <i class="fas fa-running"></i>
                    <div>
                        <strong style="text-transform: capitalize;">${escapeHtml(team.position)}</strong>
                        <span>${t('profile.position', 'Position')}</span>
                    </div>
                </div>` : ''}
                ${team.jersey_number ? `
                <div class="profile-stat-card">
                    <i class="fas fa-tshirt"></i>
                    <div>
                        <strong>#${team.jersey_number}</strong>
                        <span>${t('profile.jersey', 'Jersey')}</span>
                    </div>
                </div>` : ''}
            </div>
        `;

        // Personal stats section
        html += `
            <div class="profile-section-label">
                <i class="fas fa-chart-bar"></i> ${t('profile.personalStats', 'Personal Stats')}
            </div>
            <div class="profile-stat-cards">
                <div class="profile-stat-card">
                    <i class="fas fa-futbol"></i>
                    <div><strong>${stats.goals}</strong><span>${t('profile.goals', 'Goals')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-hands-helping"></i>
                    <div><strong>${stats.assists}</strong><span>${t('profile.assists', 'Assists')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-square" style="color: #f1c40f;"></i>
                    <div><strong>${stats.yellow_cards}</strong><span>${t('profile.yellowCards', 'Yellow Cards')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-square" style="color: #e74c3c;"></i>
                    <div><strong>${stats.red_cards}</strong><span>${t('profile.redCards', 'Red Cards')}</span></div>
                </div>
            </div>
        `;

        // Leave team button
        html += `
            <div style="margin-top: 16px; text-align: right;">
                <button class="btn btn-danger btn-sm" onclick="Auth.handleLeaveTeam()">
                    <i class="fas fa-sign-out-alt"></i> ${t('profile.leaveTeam', 'Leave Team')}
                </button>
            </div>
        `;

        // Recent matches section
        if (recentMatches && recentMatches.length > 0) {
            html += `
                <div class="profile-section-label">
                    <i class="fas fa-calendar-alt"></i> ${t('profile.recentMatches', 'Recent Matches')}
                </div>
                <div class="profile-recent-matches">
            `;

            recentMatches.forEach(match => {
                const result = this.getMatchResult(match, team.team_id);
                const resultLabel = result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D';
                const date = new Date(match.match_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

                html += `
                    <div class="profile-match-item">
                        <span class="profile-match-teams">${escapeHtml(match.team1_name)} ${match.team1_score} - ${match.team2_score} ${escapeHtml(match.team2_name)}</span>
                        <span class="profile-match-result ${result}">${resultLabel}</span>
                        <span class="profile-match-date">${date}</span>
                    </div>
                `;
            });

            html += `</div>`;
        }

        container.innerHTML = html;
    },

    renderCoachProfile(container, data, t) {
        const { team, record, players, tournaments } = data;

        if (!team) {
            container.innerHTML = `<p class="profile-no-data">${t('profile.noTeam', 'No team yet')}</p>`;
            return;
        }

        // Team overview
        let html = `
            <div class="profile-section-label">
                <i class="fas fa-shield-alt"></i> ${t('profile.teamOverview', 'Team Overview')}
            </div>
            <div class="profile-stat-cards">
                <div class="profile-stat-card">
                    <div class="profile-team-logo" style="background: ${escapeHtml(team.logo_color || '#2ecc71')};">${escapeHtml(team.logo || team.name.replace(/\s+/g, '').substring(0, 3).toUpperCase())}</div>
                    <div>
                        <strong>${escapeHtml(team.name)}</strong>
                        <span>${team.players_count}/25 ${t('teams.players', 'Players')}</span>
                    </div>
                </div>
                ${tournaments.length > 0 ? `
                <div class="profile-stat-card">
                    <i class="fas fa-trophy"></i>
                    <div>
                        <strong>${escapeHtml(tournaments[0].name)}</strong>
                        <span class="status-badge ${tournaments[0].status}">${t('tournaments.' + tournaments[0].status, tournaments[0].status)}</span>
                    </div>
                </div>` : ''}
            </div>
        `;

        // Team record
        html += `
            <div class="profile-section-label">
                <i class="fas fa-chart-line"></i> ${t('profile.teamRecord', 'Team Record')}
            </div>
            <div class="profile-stat-cards">
                <div class="profile-stat-card">
                    <i class="fas fa-futbol"></i>
                    <div><strong>${record.total_matches}</strong><span>${t('profile.matches', 'Matches')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-check-circle" style="color: #2ecc71;"></i>
                    <div><strong>${record.wins}</strong><span>${t('profile.wins', 'Wins')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-minus-circle" style="color: #f1c40f;"></i>
                    <div><strong>${record.draws}</strong><span>${t('profile.draws', 'Draws')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-times-circle" style="color: #e74c3c;"></i>
                    <div><strong>${record.losses}</strong><span>${t('profile.losses', 'Losses')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-arrow-up" style="color: #2ecc71;"></i>
                    <div><strong>${record.goals_for}</strong><span>${t('profile.goalsFor', 'Goals For')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-arrow-down" style="color: #e74c3c;"></i>
                    <div><strong>${record.goals_against}</strong><span>${t('profile.goalsAgainst', 'Goals Against')}</span></div>
                </div>
            </div>
        `;

        // Roster
        if (players.length > 0) {
            html += `
                <div class="profile-section-label">
                    <i class="fas fa-list"></i> ${t('profile.roster', 'Roster')}
                </div>
                <div class="profile-roster">
            `;
            players.forEach(p => {
                html += `
                    <div class="profile-roster-item">
                        <span class="profile-roster-number">${p.jersey_number ? '#' + p.jersey_number : '-'}</span>
                        <span class="profile-roster-name">${escapeHtml(p.player_name)}</span>
                        <span class="profile-roster-position">${escapeHtml(p.position || '-')}</span>
                    </div>
                `;
            });
            html += `</div>`;
        }

        container.innerHTML = html;
    },

    renderOrganizerProfile(container, data, t) {
        const { tournaments, counts } = data;

        if (counts.total === 0) {
            container.innerHTML = `<p class="profile-no-data">${t('tournaments.noTournaments', 'No tournaments yet')}</p>`;
            return;
        }

        // Summary counts
        let html = `
            <div class="profile-stat-cards">
                <div class="profile-stat-card">
                    <i class="fas fa-trophy"></i>
                    <div><strong>${counts.total}</strong><span>${t('profile.totalTournaments', 'Total')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-play" style="color: #2ecc71;"></i>
                    <div><strong>${counts.active}</strong><span>${t('tournaments.active', 'Active')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-clock" style="color: #3498db;"></i>
                    <div><strong>${counts.upcoming}</strong><span>${t('tournaments.upcoming', 'Upcoming')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-flag-checkered"></i>
                    <div><strong>${counts.finished}</strong><span>${t('tournaments.finished', 'Finished')}</span></div>
                </div>
            </div>
        `;

        // Tournament list
        html += `
            <div class="profile-section-label">
                <i class="fas fa-list"></i> ${t('profile.myTournaments', 'My Tournaments')}
            </div>
            <div class="profile-tournament-list">
        `;

        tournaments.forEach(tn => {
            html += `
                <div class="profile-tournament-item">
                    <span class="profile-tournament-name">${escapeHtml(tn.name)}</span>
                    <span class="status-badge ${tn.status}">${t('tournaments.' + tn.status, tn.status)}</span>
                    <span class="profile-tournament-teams">${tn.teams_count}/${tn.max_teams} ${t('teams.title', 'Teams')}</span>
                </div>
            `;
        });

        html += `</div>`;
        container.innerHTML = html;
    },

    renderAdminProfile(container, data, t) {
        const { stats } = data;

        const html = `
            <div class="profile-section-label">
                <i class="fas fa-chart-bar"></i> ${t('profile.systemOverview', 'System Overview')}
            </div>
            <div class="profile-stat-cards">
                <div class="profile-stat-card">
                    <i class="fas fa-users"></i>
                    <div><strong>${stats.users}</strong><span>${t('admin.users', 'Users')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-shield-alt"></i>
                    <div><strong>${stats.teams}</strong><span>${t('teams.title', 'Teams')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-trophy"></i>
                    <div><strong>${stats.tournaments}</strong><span>${t('nav.tournaments', 'Tournaments')}</span></div>
                </div>
                <div class="profile-stat-card">
                    <i class="fas fa-futbol"></i>
                    <div><strong>${stats.matches}</strong><span>${t('nav.matches', 'Matches')}</span></div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    },

    getMatchResult(match, teamId) {
        const isTeam1 = match.team1_id === teamId;
        const myScore = isTeam1 ? match.team1_score : match.team2_score;
        const oppScore = isTeam1 ? match.team2_score : match.team1_score;
        if (myScore > oppScore) return 'win';
        if (myScore < oppScore) return 'loss';
        return 'draw';
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

            await API.login(credentials);

            UI.showNotification(I18n.t('messages.success.login'), 'success');
            this.closeAuthModal();
            this.updateUI();

            if (window.Tournaments) Tournaments.load();
            if (window.Teams) Teams.load();
            if (window.Statistics) Statistics.load();

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

            await API.register(userData);

            this.closeAuthModal();

            // Show "check your email" popup
            const notice = document.createElement('div');
            notice.style.cssText = `
                position:fixed;top:24px;left:50%;transform:translateX(-50%);
                background:#1a1a2e;border:2px solid #2ecc71;border-radius:12px;
                padding:28px 36px;z-index:9999;text-align:center;max-width:420px;width:90%;
                color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.6);
            `;
            notice.innerHTML = `
                <div style="font-size:40px;margin-bottom:12px;">📧</div>
                <h3 style="color:#2ecc71;margin:0 0 10px;">Check your email!</h3>
                <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 20px;">
                    We sent a verification link to<br>
                    <strong style="color:#fff;">${escapeHtml(userData.email)}</strong><br><br>
                    Open your email and click the link.<br>
                    You will be signed in automatically.
                </p>
                <button onclick="openMailAndClose(this, '${escapeHtml(userData.email)}')"
                    style="background:#2ecc71;border:none;color:#000;padding:10px 32px;
                           border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px;">
                    Open Email
                </button>
            `;
            document.body.appendChild(notice);

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
        if (confirm(window.I18n ? I18n.t('common.confirmLogout') : 'Are you sure you want to logout?')) {
            API.logout();
            UI.showNotification(window.I18n ? I18n.t('messages.success.logout') : 'Logged out', 'success');
            this.updateUI();

            if (window.Tournaments) Tournaments.load();
            if (window.Teams) Teams.load();
            if (window.Matches) Matches.load();
            if (window.Statistics) Statistics.load();
        }
    },

    openEditProfileModal() {
        const user = API.getUser();
        if (!user) return;

        // Create modal if it doesn't exist
        let modal = document.getElementById('edit-profile-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'edit-profile-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" onclick="Auth.closeEditProfileModal()">&times;</button>
                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-user-edit"></i> ${window.I18n ? I18n.t('profile.editProfile') : 'Edit Profile'}
                    </h2>
                    <form id="edit-profile-form" onsubmit="Auth.handleEditProfile(event)">
                        <div class="form-group">
                            <label class="form-label">${window.I18n ? I18n.t('auth.name') : 'Name'}</label>
                            <input type="text" class="form-input" id="edit-profile-name" minlength="2" maxlength="100" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${window.I18n ? I18n.t('auth.email') : 'Email'}</label>
                            <input type="email" class="form-input" id="edit-profile-email" required>
                        </div>
                        <hr style="border-color: rgba(255,255,255,0.1); margin: 24px 0;">
                        <p style="color: #b0b0b0; font-size: 14px; margin-bottom: 16px;">
                            ${window.I18n ? I18n.t('profile.changePasswordHint') : 'Leave password fields empty to keep current password'}
                        </p>
                        <div class="form-group">
                            <label class="form-label">${window.I18n ? I18n.t('profile.currentPassword') : 'Current Password'}</label>
                            <input type="password" class="form-input" id="edit-profile-current-password" minlength="6">
                        </div>
                        <div class="form-group">
                            <label class="form-label">${window.I18n ? I18n.t('profile.newPassword') : 'New Password'}</label>
                            <input type="password" class="form-input" id="edit-profile-new-password" minlength="6">
                        </div>
                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Auth.closeEditProfileModal()">
                                ${window.I18n ? I18n.t('common.cancel') : 'Cancel'}
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text">${window.I18n ? I18n.t('common.save') : 'Save'}</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);

            // Close on overlay click
            modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeEditProfileModal());
        }

        // Fill current values
        document.getElementById('edit-profile-name').value = user.name || '';
        document.getElementById('edit-profile-email').value = user.email || '';
        document.getElementById('edit-profile-current-password').value = '';
        document.getElementById('edit-profile-new-password').value = '';

        UI.openModal('edit-profile-modal');
    },

    closeEditProfileModal() {
        UI.closeModal('edit-profile-modal');
    },

    async handleEditProfile(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);

        try {
            const data = {
                name: document.getElementById('edit-profile-name').value.trim(),
                email: document.getElementById('edit-profile-email').value.trim(),
            };

            const currentPassword = document.getElementById('edit-profile-current-password').value;
            const newPassword = document.getElementById('edit-profile-new-password').value;

            if (newPassword) {
                if (!currentPassword) {
                    UI.showNotification(window.I18n ? I18n.t('profile.currentPasswordRequired') : 'Enter current password', 'error');
                    UI.hideButtonLoading(submitBtn);
                    return;
                }
                data.currentPassword = currentPassword;
                data.newPassword = newPassword;
            }

            const response = await API.updateProfile(data);

            // Update local user data
            if (response.user) {
                const stored = API.getUser() || {};
                stored.name = response.user.name;
                stored.email = response.user.email;
                API.setUser(stored);
            }

            // If email changed, update the stored JWT to the new one
            if (response.token) {
                API.setToken(response.token);
            }

            UI.showNotification(window.I18n ? I18n.t('messages.success.profileUpdated') : 'Profile updated', 'success');
            this.closeEditProfileModal();

            // Refresh profile display
            const user = API.getUser();
            this.updateUI(user);
            this.updateProfileStats(user);

        } catch (error) {
            console.error('Failed to update profile:', error);
            UI.showNotification(error.message || 'Failed to update profile', 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    setupLanguageChangeListener() {
        window.addEventListener('languageChanged', () => {
            if (API.isAuthenticated()) {
                const user = API.getUser();
                this.updateProfileStats(user);
            }
        });
    },

    updateUI() {
        const getStartedBtn = document.getElementById('get-started-btn');
        const profileBtn = document.getElementById('profile-btn');
        const createTournamentBtn = document.getElementById('create-tournament-btn');
        const createTeamBtn = document.getElementById('create-team-btn');

        if (API.isAuthenticated()) {
            const user = API.getUser();

            if (getStartedBtn) getStartedBtn.classList.remove('show');
            if (profileBtn) profileBtn.classList.add('show');

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

        // Update hero/profile section
        this.updateProfileSection();
    },

    async handleLeaveTeam() {
        const t = window.I18n ? (k, fb) => I18n.t(k, fb) : (k, fb) => fb;
        if (!confirm(t('profile.confirmLeaveTeam', 'Are you sure you want to leave your team?'))) return;
        try {
            await API.leaveTeam();
            UI.showNotification(t('profile.leftTeam', 'You have left the team'), 'success');
            await this.loadProfile();
            if (window.Teams) Teams.load();
            if (window.Statistics) Statistics.load();
        } catch (error) {
            UI.showNotification(error.message || t('messages.error.generic', 'Error'), 'error');
        }
    },

    // ─── FORGOT PASSWORD ────────────────────────────────────────────────────────

    openForgotPasswordModal() {
        // Fallback: shown only when login email field is empty
        let modal = document.getElementById('forgot-password-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'forgot-password-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content" style="max-width:420px;">
                    <button class="modal-close" onclick="Auth.closeForgotPasswordModal()">&times;</button>
                    <h2 style="margin-bottom:8px;text-align:center;color:white;">
                        <i class="fas fa-key"></i> ${window.I18n ? I18n.t('auth.forgotPassword') : 'Forgot Password'}
                    </h2>
                    <p style="color:#aaa;text-align:center;margin-bottom:24px;font-size:14px;">
                        ${window.I18n ? I18n.t('auth.forgotPasswordHint') : 'Enter your email and we will send you a reset link.'}
                    </p>
                    <form id="forgot-password-form">
                        <div class="form-group">
                            <label class="form-label">${window.I18n ? I18n.t('auth.email') : 'Email'}</label>
                            <input type="email" class="form-input" id="forgot-password-email" placeholder="your@email.com" required>
                        </div>
                        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:16px;">
                            <span class="btn-text">${window.I18n ? I18n.t('auth.sendResetLink') : 'Send Reset Link'}</span>
                            <div class="spinner" style="display:none;"></div>
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('.modal-overlay').addEventListener('click', () => this.closeForgotPasswordModal());
            modal.querySelector('#forgot-password-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const btn = e.target.querySelector('button[type="submit"]');
                const email = document.getElementById('forgot-password-email').value.trim();
                UI.showButtonLoading(btn);
                try {
                    await this.sendForgotPasswordRequest(email);
                    this.closeForgotPasswordModal();
                } catch(err) {
                    UI.showNotification(err.message || 'Error', 'error');
                } finally {
                    UI.hideButtonLoading(btn);
                }
            });
        }
        UI.openModal('forgot-password-modal');
    },

    closeForgotPasswordModal() {
        UI.closeModal('forgot-password-modal');
    },

    async sendForgotPasswordRequest(email) {
        try {
            await API.request('/auth/forgot-password', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
            this.showResetEmailNotice(email);
        } catch (error) {
            UI.showNotification(error.message || 'Failed to send reset link', 'error');
        }
    },

    showResetEmailNotice(email) {
        const t = (key, fallback) => window.I18n ? I18n.t(key) : fallback;
        const notice = document.createElement('div');
        notice.style.cssText = `
            position:fixed;top:24px;left:50%;transform:translateX(-50%);
            background:#1a1a2e;border:2px solid #2ecc71;border-radius:12px;
            padding:28px 36px;z-index:9999;text-align:center;max-width:420px;width:90%;
            color:#fff;box-shadow:0 8px 32px rgba(0,0,0,0.6);
        `;
        notice.innerHTML = `
            <div style="font-size:40px;margin-bottom:12px;">🔑</div>
            <h3 style="color:#2ecc71;margin:0 0 10px;">${t('auth.checkEmail', 'Check your email!')}</h3>
            <p style="color:#ccc;font-size:14px;line-height:1.7;margin:0 0 20px;">
                ${t('auth.resetSentTo', 'We sent a password reset link to')}<br>
                <strong style="color:#fff;">${escapeHtml(email)}</strong><br><br>
                ${t('auth.clickLinkToReset', 'Click the link in the email to set a new password.')}
            </p>
            <button onclick="openMailAndClose(this, '${escapeHtml(email)}')"
                style="background:#2ecc71;border:none;color:#000;padding:10px 32px;
                       border-radius:8px;cursor:pointer;font-weight:bold;font-size:14px;">
                <i class="fas fa-envelope"></i> ${t('auth.openEmail', 'Open Email')}
            </button>
        `;
        document.body.appendChild(notice);
    },

    // ─── RESET PASSWORD ──────────────────────────────────────────────────────────

    openResetPasswordModal(token) {
        let modal = document.getElementById('reset-password-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'reset-password-modal';
            modal.innerHTML = `
                <div class="modal-overlay"></div>
                <div class="modal-content" style="max-width:420px;">
                    <h2 style="margin-bottom:8px;text-align:center;color:white;">
                        <i class="fas fa-lock"></i> ${window.I18n ? I18n.t('auth.newPassword') : 'Set New Password'}
                    </h2>
                    <p style="color:#aaa;text-align:center;margin-bottom:24px;font-size:14px;">
                        ${window.I18n ? I18n.t('auth.newPasswordHint') : 'Enter your new password below.'}
                    </p>
                    <form id="reset-password-form">
                        <div class="form-group">
                            <label class="form-label">${window.I18n ? I18n.t('auth.newPassword') : 'New Password'}</label>
                            <input type="password" class="form-input" id="reset-password-new" minlength="6" placeholder="........" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">${window.I18n ? I18n.t('auth.confirmPassword') : 'Confirm Password'}</label>
                            <input type="password" class="form-input" id="reset-password-confirm" minlength="6" placeholder="........" required>
                        </div>
                        <p id="reset-password-mismatch" style="color:#e74c3c;font-size:13px;display:none;">
                            ${window.I18n ? I18n.t('auth.passwordsDoNotMatch') : 'Passwords do not match!'}
                        </p>
                        <button type="submit" class="btn btn-primary" style="width:100%;margin-top:16px;">
                            <span class="btn-text">${window.I18n ? I18n.t('auth.saveNewPassword') : 'Save New Password'}</span>
                            <div class="spinner" style="display:none;"></div>
                        </button>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            modal.querySelector('#reset-password-form').addEventListener('submit', (e) => this.handleResetPassword(e, token));
        }
        UI.openModal('reset-password-modal');
    },

    async handleResetPassword(e, token) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        const password = document.getElementById('reset-password-new').value;
        const confirm = document.getElementById('reset-password-confirm').value;
        const mismatch = document.getElementById('reset-password-mismatch');

        if (password !== confirm) {
            mismatch.style.display = 'block';
            return;
        }
        mismatch.style.display = 'none';

        UI.showButtonLoading(btn);
        try {
            await API.request('/auth/reset-password', {
                method: 'POST',
                body: JSON.stringify({ token, password })
            });
            UI.showNotification(
                window.I18n ? I18n.t('auth.passwordResetSuccess') : 'Password reset! You can now log in.',
                'success'
            );
            UI.closeModal('reset-password-modal');
            setTimeout(() => this.openAuthModal('login'), 400);
        } catch (error) {
            UI.showNotification(error.message || 'Failed to reset password', 'error');
        } finally {
            UI.hideButtonLoading(btn);
        }
    },

};

window.Auth = Auth;
