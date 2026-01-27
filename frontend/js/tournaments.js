// ============================================
// TOURNAMENTS MODULE
// Tournament management functionality
// ============================================

const Tournaments = {

    tournaments: [],
    currentTournament: null,
    currentMatch: null,

    init() {
        this.createModals();
        this.attachEventListeners();
        this.load();
    },

    createModals() {
        const modalsHTML = `
            <!-- Create Tournament Modal -->
            <div class="modal" id="create-tournament-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-create-tournament">&times;</button>

                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-trophy"></i> <span data-i18n="tournaments.createTournament">Create Tournament</span>
                    </h2>

                    <form id="create-tournament-form">
                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.tournamentName">Tournament Name</label>
                            <input
                                type="text"
                                class="form-input"
                                id="tournament-name"
                                data-i18n-placeholder="tournaments.tournamentNamePlaceholder"
                                placeholder="Champions League 2024"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.type">Type</label>
                            <select class="form-select" id="tournament-type" required>
                                <option value="" data-i18n="tournaments.selectType">Select type</option>
                                <option value="league" data-i18n="tournaments.types.league">League (All vs All)</option>
                                <option value="playoff" data-i18n="tournaments.types.playoff">Playoff (Knockout)</option>
                                <option value="group_playoff" data-i18n="tournaments.types.group_playoff">Group + Playoff</option>
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label" data-i18n="tournaments.startDate">Start Date</label>
                                <input
                                    type="date"
                                    class="form-input"
                                    id="tournament-start-date"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label" data-i18n="tournaments.endDate">End Date</label>
                                <input
                                    type="date"
                                    class="form-input"
                                    id="tournament-end-date"
                                    required
                                >
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.location">Location</label>
                            <input
                                type="text"
                                class="form-input"
                                id="tournament-location"
                                data-i18n-placeholder="tournaments.locationPlaceholder"
                                placeholder="City, Stadium"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.maxTeams">Maximum Teams</label>
                            <select class="form-select" id="tournament-max-teams" required>
                                <option value="4">4</option>
                                <option value="8" selected>8</option>
                                <option value="12">12</option>
                                <option value="16">16</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.description">Description</label>
                            <textarea
                                class="form-textarea"
                                id="tournament-description"
                                data-i18n-placeholder="tournaments.descriptionPlaceholder"
                                placeholder="Tournament details..."
                                rows="4"
                            ></textarea>
                        </div>

                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Tournaments.closeCreateModal()">
                                <span data-i18n="common.cancel">Cancel</span>
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text" data-i18n="tournaments.createTournament">Create Tournament</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Tournament Details Modal -->
            <div class="modal" id="tournament-details-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content modal-content-large">
                    <button class="modal-close" id="close-tournament-details">&times;</button>

                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 24px;">
                        <h2 style="color: white; margin: 0;" id="modal-tournament-name">Tournament Name</h2>
                        <span class="badge badge-upcoming" id="modal-tournament-status">Status</span>
                    </div>

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-calendar-alt"></i>
                            <span id="modal-tournament-dates">Dates</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-map-marker-alt"></i>
                            <span id="modal-tournament-location">Location</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-users"></i>
                            <span id="modal-tournament-teams">Teams</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-list"></i>
                            <span id="modal-tournament-type">Type</span>
                        </div>
                    </div>

                    <p style="color: #b0b0b0; line-height: 1.6; margin-bottom: 32px;" id="modal-tournament-description">
                        Description
                    </p>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <button class="btn btn-primary" id="join-tournament-btn" style="display: none;">
                            <i class="fas fa-plus-circle"></i> <span data-i18n="tournaments.joinTournament">Join Tournament</span>
                        </button>
                        <p id="join-tournament-status" style="margin-top: 16px; display: none; font-size: 16px; font-weight: 600;">
                            <i class="fas fa-check-circle"></i> <span id="join-status-text"></span>
                        </p>
                    </div>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <button class="btn btn-primary" id="generate-fixtures-btn" style="display: none;">
                            <i class="fas fa-magic"></i> <span data-i18n="tournaments.generateFixtures">Generate Fixtures</span>
                        </button>
                    </div>

                    <!-- Tabs for Standings, Statistics, Fixtures -->
                    <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
                        <button class="btn btn-secondary tournament-tab active" data-tab="standings" onclick="Tournaments.switchTab('standings')">
                            <i class="fas fa-table"></i> <span data-i18n="tournaments.standings">Standings</span>
                        </button>
                        <button class="btn btn-secondary tournament-tab" data-tab="statistics" onclick="Tournaments.switchTab('statistics')">
                            <i class="fas fa-chart-bar"></i> <span data-i18n="tournaments.statistics">Statistics</span>
                        </button>
                        <button class="btn btn-secondary tournament-tab" data-tab="fixtures" onclick="Tournaments.switchTab('fixtures')">
                            <i class="fas fa-calendar-alt"></i> <span data-i18n="tournaments.fixtures">Fixtures</span>
                        </button>
                    </div>

                    <!-- Standings Tab -->
                    <div id="tournament-standings-tab" class="tournament-tab-content">
                        <div id="tournament-standings-container" style="display: none;">
                            <div id="tournament-standings-table"></div>
                        </div>
                        <div class="empty-state" id="tournament-no-standings">
                            <div class="empty-icon"><i class="fas fa-table"></i></div>
                            <h3 class="empty-title" data-i18n="tournaments.noStandings">No Standings Yet</h3>
                            <p class="empty-subtitle" data-i18n="tournaments.standingsSubtitle">Standings will appear after matches are played</p>
                        </div>
                    </div>

                    <!-- Statistics Tab -->
                    <div id="tournament-statistics-tab" class="tournament-tab-content" style="display: none;">
                        <div id="tournament-statistics-container" style="display: none;">
                            <div id="tournament-statistics-list"></div>
                        </div>
                        <div class="empty-state" id="tournament-no-statistics">
                            <div class="empty-icon"><i class="fas fa-chart-bar"></i></div>
                            <h3 class="empty-title" data-i18n="tournaments.noStatistics">No Statistics Yet</h3>
                            <p class="empty-subtitle" data-i18n="tournaments.statisticsSubtitle">Player statistics will appear after match events are recorded</p>
                        </div>
                    </div>

                    <!-- Fixtures Tab -->
                    <div id="tournament-fixtures-tab" class="tournament-tab-content" style="display: none;">
                        <div id="tournament-fixtures-container" style="display: none;">
                            <div id="tournament-fixtures-list"></div>
                        </div>
                        <div class="empty-state" id="tournament-no-fixtures">
                            <div class="empty-icon"><i class="fas fa-calendar-alt"></i></div>
                            <h3 class="empty-title" data-i18n="tournaments.noFixtures">No Fixtures Yet</h3>
                            <p class="empty-subtitle" data-i18n="tournaments.fixturesSubtitle">Generate fixtures to see the match schedule!</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fixtures Settings Modal -->
            <div class="modal" id="fixtures-settings-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-fixtures-settings">&times;</button>

                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-magic"></i> <span data-i18n="fixturesSettings.title">Generate Fixtures Settings</span>
                    </h2>

                    <form id="fixtures-settings-form">
                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.startDate">Start Date</label>
                            <input type="date" class="form-input" id="fixtures-start-date" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="fixturesSettings.matchTime">Match Time</label>
                            <input type="time" class="form-input" id="fixtures-match-time" value="18:00" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="fixturesSettings.matchDays">Match Days</label>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="1"> <span data-i18n="fixturesSettings.days.mon">Mon</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="2"> <span data-i18n="fixturesSettings.days.tue">Tue</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="3" checked> <span data-i18n="fixturesSettings.days.wed">Wed</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="4"> <span data-i18n="fixturesSettings.days.thu">Thu</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="5" checked> <span data-i18n="fixturesSettings.days.fri">Fri</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="6"> <span data-i18n="fixturesSettings.days.sat">Sat</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="0"> <span data-i18n="fixturesSettings.days.sun">Sun</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="fixturesSettings.matchesPerDay">Matches Per Day</label>
                            <select class="form-select" id="fixtures-matches-per-day" required>
                                <option value="1">1</option>
                                <option value="2" selected>2</option>
                                <option value="3">3</option>
                                <option value="4">4</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="fixturesSettings.venue">Venue</label>
                            <input type="text" class="form-input" id="fixtures-venue" data-i18n-placeholder="fixturesSettings.venuePlaceholder" placeholder="Stadium name">
                        </div>

                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Tournaments.closeFixturesSettingsModal()">
                                <span data-i18n="common.cancel">Cancel</span>
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text" data-i18n="fixturesSettings.generate">Generate</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Match Results Modal -->
            <div class="modal" id="match-results-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content modal-content-large">
                    <button class="modal-close" id="close-match-results">&times;</button>

                    <h2 style="margin-bottom: 24px; text-align: center; color: white;">
                        <i class="fas fa-futbol"></i> <span data-i18n="match.enterResults">Enter Match Results</span>
                    </h2>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;" id="match-home-logo">H</div>
                            <div style="font-size: 18px; font-weight: bold; color: white;" id="match-home-name">Home Team</div>
                        </div>
                        <div style="font-size: 28px; font-weight: bold; color: #2ecc71;" data-i18n="common.vs">VS</div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;" id="match-away-logo">A</div>
                            <div style="font-size: 18px; font-weight: bold; color: white;" id="match-away-name">Away Team</div>
                        </div>
                    </div>

                    <div style="margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <h3 style="color: white; margin-bottom: 16px;">
                            <i class="fas fa-star"></i> <span data-i18n="match.finalScore">Final Score</span>
                        </h3>
                        <form id="update-score-form">
                            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: end;">
                                <div class="form-group" style="margin: 0;">
                                    <label class="form-label" data-i18n="match.homeScore">Home Score</label>
                                    <input type="number" class="form-input" id="home-score" min="0" value="0" required>
                                </div>
                                <div style="font-size: 24px; font-weight: bold; color: #b0b0b0; padding-bottom: 12px;">-</div>
                                <div class="form-group" style="margin: 0;">
                                    <label class="form-label" data-i18n="match.awayScore">Away Score</label>
                                    <input type="number" class="form-input" id="away-score" min="0" value="0" required>
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 16px;">
                                <span class="btn-text" data-i18n="match.updateScore">Update Score</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </form>
                    </div>

                    <div style="margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <h3 style="color: white; margin-bottom: 16px;">
                            <i class="fas fa-futbol"></i> <span data-i18n="match.addGoal">Add Goal</span>
                        </h3>
                        <form id="add-goal-form">
                            <div class="form-group">
                                <label class="form-label" data-i18n="match.team">Team</label>
                                <select class="form-select" id="goal-team" required>
                                    <option value="" data-i18n="match.selectTeam">Select team</option>
                                    <option value="home" data-i18n="match.homeTeam">Home Team</option>
                                    <option value="away" data-i18n="match.awayTeam">Away Team</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" data-i18n="match.playerEmail">Player (email)</label>
                                <input type="email" class="form-input" id="goal-player-email" data-i18n-placeholder="match.playerEmailPlaceholder" placeholder="player@example.com" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" data-i18n="match.minute">Minute</label>
                                <input type="number" class="form-input" id="goal-minute" min="1" max="120" placeholder="45" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" data-i18n="match.assist">Assist (optional - email)</label>
                                <input type="email" class="form-input" id="goal-assist-email" data-i18n-placeholder="match.assistPlaceholder" placeholder="assistant@example.com">
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                <span class="btn-text"><i class="fas fa-plus"></i> <span data-i18n="match.addGoal">Add Goal</span></span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </form>
                    </div>

                    <div style="margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <h3 style="color: white; margin-bottom: 16px;">
                            <i class="fas fa-square"></i> <span data-i18n="match.addCard">Add Card</span>
                        </h3>
                        <form id="add-card-form">
                            <div class="form-group">
                                <label class="form-label" data-i18n="match.team">Team</label>
                                <select class="form-select" id="card-team" required>
                                    <option value="" data-i18n="match.selectTeam">Select team</option>
                                    <option value="home" data-i18n="match.homeTeam">Home Team</option>
                                    <option value="away" data-i18n="match.awayTeam">Away Team</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" data-i18n="match.playerEmail">Player (email)</label>
                                <input type="email" class="form-input" id="card-player-email" data-i18n-placeholder="match.playerEmailPlaceholder" placeholder="player@example.com" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label" data-i18n="match.cardType">Card Type</label>
                                <select class="form-select" id="card-type" required>
                                    <option value="" data-i18n="match.selectCardType">Select type</option>
                                    <option value="yellow_card" data-i18n="match.yellowCard">Yellow Card</option>
                                    <option value="red_card" data-i18n="match.redCard">Red Card</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label" data-i18n="match.minute">Minute</label>
                                <input type="number" class="form-input" id="card-minute" min="1" max="120" placeholder="67" required>
                            </div>
                            <button type="submit" class="btn btn-primary" style="width: 100%;">
                                <span class="btn-text"><i class="fas fa-plus"></i> <span data-i18n="match.addCard">Add Card</span></span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </form>
                    </div>

                    <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <h3 style="color: white; margin-bottom: 16px;">
                            <i class="fas fa-list"></i> <span data-i18n="match.matchEvents">Match Events</span>
                        </h3>
                        <div id="match-events-list"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalsHTML);

        // Apply translations to newly created modals
        if (window.I18n) {
            I18n.applyTranslations();
        }
    },

    attachEventListeners() {
        // Listen for language changes to update dynamic content
        window.addEventListener('languageChanged', () => {
            if (window.I18n) {
                I18n.applyTranslations();
            }
            // Re-render cards with new language
            this.render();
            // If tournament details modal is open, refresh standings/statistics
            if (this.currentTournament && document.getElementById('tournament-details-modal').classList.contains('active')) {
                this.loadStandings(this.currentTournament.id);
                this.loadStatistics(this.currentTournament.id);
                this.loadTournamentFixtures(this.currentTournament.id);
            }
        });
        const createBtn = document.getElementById('create-tournament-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateModal());
        }

        document.getElementById('close-create-tournament')?.addEventListener('click', () => this.closeCreateModal());
        document.getElementById('close-tournament-details')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('close-fixtures-settings')?.addEventListener('click', () => this.closeFixturesSettingsModal());
        document.getElementById('close-match-results')?.addEventListener('click', () => this.closeMatchResultsModal());

        document.querySelector('#create-tournament-modal .modal-overlay')?.addEventListener('click', () => this.closeCreateModal());
        document.querySelector('#tournament-details-modal .modal-overlay')?.addEventListener('click', () => this.closeDetailsModal());
        document.querySelector('#fixtures-settings-modal .modal-overlay')?.addEventListener('click', () => this.closeFixturesSettingsModal());
        document.querySelector('#match-results-modal .modal-overlay')?.addEventListener('click', () => this.closeMatchResultsModal());

        document.getElementById('create-tournament-form')?.addEventListener('submit', (e) => this.handleCreate(e));
        document.getElementById('fixtures-settings-form')?.addEventListener('submit', (e) => this.handleGenerateFixtures(e));
        document.getElementById('update-score-form')?.addEventListener('submit', (e) => this.handleUpdateScore(e));
        document.getElementById('add-goal-form')?.addEventListener('submit', (e) => this.handleAddGoal(e));
        document.getElementById('add-card-form')?.addEventListener('submit', (e) => this.handleAddCard(e));
    },

    async load() {
        try {
            UI.showLoading('tournaments-list');

            const response = await API.getTournaments();
            this.tournaments = response.tournaments || [];

            this.updateStats();
            this.render();

        } catch (error) {
            console.error('Failed to load tournaments:', error);
            UI.showNotification(I18n.t('messages.error.loadTournaments'), 'error');
            this.showEmpty();
        }
    },

    updateStats() {
        const total = this.tournaments.length;
        const active = this.tournaments.filter(t => t.status === 'active').length;
        const finished = this.tournaments.filter(t => t.status === 'finished').length;

        document.getElementById('total-tournaments').textContent = total;
        document.getElementById('active-tournaments').textContent = active;
        document.getElementById('finished-tournaments').textContent = finished;
    },

    render() {
        const container = document.getElementById('tournaments-list');
        const emptyState = document.getElementById('tournaments-empty');

        if (!container) return;

        UI.hideLoading('tournaments-list');

        if (this.tournaments.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = '';

        this.tournaments.forEach(tournament => {
            const card = this.createCard(tournament);
            container.appendChild(card);
        });
    },

    createCard(tournament) {
        const card = document.createElement('div');
        card.className = 'card tournament-card';
        card.onclick = () => this.openDetailsModal(tournament);

        const startDate = UI.formatDate(tournament.start_date);
        const endDate = UI.formatDate(tournament.end_date);

        const statusClass = `badge-${tournament.status}`;
        const statusText = I18n.t(`tournaments.${tournament.status}`);

        card.innerHTML = `
            <div class="tournament-header">
                <h3 class="tournament-title">${tournament.name}</h3>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>

            <div class="tournament-meta">
                <div class="meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${startDate} - ${endDate}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${tournament.location || I18n.t('common.tbd')}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${I18n.t('tournaments.teamsJoined', { current: tournament.teams_count || 0, max: tournament.max_teams })}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-list"></i>
                    <span>${this.getTypeLabel(tournament.type)}</span>
                </div>
            </div>

            <div class="tournament-description">
                ${tournament.description || I18n.t('common.noDescription')}
            </div>

            <div class="tournament-footer">
                <i class="fas fa-user"></i>
                <span>${tournament.organizer_name || I18n.t('common.unknown')}</span>
            </div>
        `;

        return card;
    },

    getTypeLabel(type) {
        return I18n.t(`tournaments.types.${type}`) || type;
    },

    showEmpty() {
        const container = document.getElementById('tournaments-list');
        const emptyState = document.getElementById('tournaments-empty');

        UI.hideLoading('tournaments-list');

        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
    },

    openCreateModal() {
        if (!API.isAuthenticated()) {
            UI.showNotification(I18n.t('messages.error.unauthorized'), 'error');
            Auth.openAuthModal('login');
            return;
        }

        const user = API.getUser();
        if (user.role !== 'organizer') {
            UI.showNotification(I18n.t('messages.error.onlyOrganizers'), 'error');
            return;
        }

        UI.openModal('create-tournament-modal');
    },

    closeCreateModal() {
        UI.closeModal('create-tournament-modal');
        document.getElementById('create-tournament-form').reset();
    },

    async openDetailsModal(tournament) {
        this.currentTournament = tournament;

        // Join WebSocket room for real-time updates
        if (window.WebSocketManager) {
            WebSocketManager.joinTournament(tournament.id);
        }

        document.getElementById('modal-tournament-name').textContent = tournament.name;

        const statusBadge = document.getElementById('modal-tournament-status');
        statusBadge.className = `badge badge-${tournament.status}`;
        statusBadge.textContent = I18n.t(`tournaments.${tournament.status}`);

        const startDate = UI.formatDate(tournament.start_date);
        const endDate = UI.formatDate(tournament.end_date);
        document.getElementById('modal-tournament-dates').textContent = `${startDate} - ${endDate}`;

        document.getElementById('modal-tournament-location').textContent = tournament.location || I18n.t('common.tbd');
        document.getElementById('modal-tournament-teams').textContent = I18n.t('tournaments.teamsJoined', { current: tournament.teams_count || 0, max: tournament.max_teams });
        document.getElementById('modal-tournament-type').textContent = this.getTypeLabel(tournament.type);
        document.getElementById('modal-tournament-description').textContent = tournament.description || I18n.t('common.noDescription');

        await this.updateJoinButton(tournament);
        await this.updateGenerateFixturesButton(tournament);

        // Load all tabs data
        await Promise.all([
            this.loadStandings(tournament.id),
            this.loadStatistics(tournament.id),
            this.loadTournamentFixtures(tournament.id)
        ]);

        // Set default tab to standings
        this.switchTab('standings');

        UI.openModal('tournament-details-modal');
    },

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tournament-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update tab content
        document.querySelectorAll('.tournament-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`tournament-${tabName}-tab`).style.display = 'block';
    },

    async loadStandings(tournamentId) {
        const container = document.getElementById('tournament-standings-container');
        const table = document.getElementById('tournament-standings-table');
        const noStandings = document.getElementById('tournament-no-standings');

        try {
            const response = await API.getStandings(tournamentId);
            const standings = response.standings || [];

            if (standings.length === 0) {
                container.style.display = 'none';
                noStandings.style.display = 'flex';
                return;
            }

            table.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; color: white;">
                    <thead>
                        <tr style="background: rgba(46, 204, 113, 0.2); text-align: left;">
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1);">${I18n.t('stats.rank')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1);">${I18n.t('stats.team')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.played')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.won')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.drawn')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.lost')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalsFor')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalsAgainst')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalDifference')}</th>
                            <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center; font-weight: bold;">${I18n.t('stats.points')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${standings.map((team, index) => `
                            <tr style="background: ${index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};">
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">${index + 1}</td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <div style="display: flex; align-items: center; gap: 10px;">
                                        <div style="
                                            width: 30px;
                                            height: 30px;
                                            background: ${team.team_color || '#2ecc71'};
                                            border-radius: 50%;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-weight: bold;
                                            font-size: 12px;
                                        ">${team.team_logo || team.team_name.substring(0, 2).toUpperCase()}</div>
                                        <span>${team.team_name}</span>
                                    </div>
                                </td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.played}</td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #2ecc71;">${team.won}</td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #f39c12;">${team.drawn}</td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #e74c3c;">${team.lost}</td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.goals_for}</td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.goals_against}</td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: ${team.goal_difference >= 0 ? '#2ecc71' : '#e74c3c'};">${team.goal_difference > 0 ? '+' : ''}${team.goal_difference}</td>
                                <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; font-weight: bold; color: #2ecc71; font-size: 16px;">${team.points}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;

            container.style.display = 'block';
            noStandings.style.display = 'none';

        } catch (error) {
            console.error('Failed to load standings:', error);
            container.style.display = 'none';
            noStandings.style.display = 'flex';
        }
    },

    async loadStatistics(tournamentId) {
        const container = document.getElementById('tournament-statistics-container');
        const list = document.getElementById('tournament-statistics-list');
        const noStats = document.getElementById('tournament-no-statistics');

        try {
            const response = await API.getPlayerStatistics(tournamentId);
            const statistics = response.statistics || [];

            if (statistics.length === 0) {
                container.style.display = 'none';
                noStats.style.display = 'flex';
                return;
            }

            // Top scorers
            const topScorers = statistics.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 10);

            list.innerHTML = `
                <div style="margin-bottom: 32px;">
                    <h4 style="color: #2ecc71; margin-bottom: 16px;"><i class="fas fa-futbol"></i> ${I18n.t('stats.topScorers')}</h4>
                    ${topScorers.length > 0 ? `
                        <div style="display: grid; gap: 8px;">
                            ${topScorers.map((player, index) => `
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    justify-content: space-between;
                                    padding: 12px;
                                    background: rgba(255,255,255,0.05);
                                    border-radius: 8px;
                                ">
                                    <div style="display: flex; align-items: center; gap: 12px;">
                                        <span style="
                                            width: 28px;
                                            height: 28px;
                                            background: ${index < 3 ? '#f39c12' : 'rgba(255,255,255,0.1)'};
                                            border-radius: 50%;
                                            display: flex;
                                            align-items: center;
                                            justify-content: center;
                                            font-weight: bold;
                                            font-size: 12px;
                                        ">${index + 1}</span>
                                        <div>
                                            <div style="color: white; font-weight: 600;">${player.player_name}</div>
                                            <div style="color: #b0b0b0; font-size: 12px;">${player.team_name}</div>
                                        </div>
                                    </div>
                                    <div style="font-size: 20px; font-weight: bold; color: #2ecc71;">${player.goals}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p style="color: #b0b0b0;">${I18n.t('stats.noGoalsScored')}</p>`}
                </div>

                <div style="margin-bottom: 32px;">
                    <h4 style="color: #f39c12; margin-bottom: 16px;"><i class="fas fa-square"></i> ${I18n.t('stats.yellowCards')}</h4>
                    ${statistics.filter(s => s.yellow_cards > 0).length > 0 ? `
                        <div style="display: grid; gap: 8px;">
                            ${statistics.filter(s => s.yellow_cards > 0).sort((a, b) => b.yellow_cards - a.yellow_cards).slice(0, 5).map(player => `
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    justify-content: space-between;
                                    padding: 12px;
                                    background: rgba(255,255,255,0.05);
                                    border-radius: 8px;
                                ">
                                    <div>
                                        <div style="color: white; font-weight: 600;">${player.player_name}</div>
                                        <div style="color: #b0b0b0; font-size: 12px;">${player.team_name}</div>
                                    </div>
                                    <div style="font-size: 18px; font-weight: bold; color: #f39c12;">${player.yellow_cards}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p style="color: #b0b0b0;">${I18n.t('stats.noYellowCards')}</p>`}
                </div>

                <div>
                    <h4 style="color: #e74c3c; margin-bottom: 16px;"><i class="fas fa-square"></i> ${I18n.t('stats.redCards')}</h4>
                    ${statistics.filter(s => s.red_cards > 0).length > 0 ? `
                        <div style="display: grid; gap: 8px;">
                            ${statistics.filter(s => s.red_cards > 0).sort((a, b) => b.red_cards - a.red_cards).slice(0, 5).map(player => `
                                <div style="
                                    display: flex;
                                    align-items: center;
                                    justify-content: space-between;
                                    padding: 12px;
                                    background: rgba(255,255,255,0.05);
                                    border-radius: 8px;
                                ">
                                    <div>
                                        <div style="color: white; font-weight: 600;">${player.player_name}</div>
                                        <div style="color: #b0b0b0; font-size: 12px;">${player.team_name}</div>
                                    </div>
                                    <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">${player.red_cards}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `<p style="color: #b0b0b0;">${I18n.t('stats.noRedCards')}</p>`}
                </div>
            `;

            container.style.display = 'block';
            noStats.style.display = 'none';

        } catch (error) {
            console.error('Failed to load statistics:', error);
            container.style.display = 'none';
            noStats.style.display = 'flex';
        }
    },

    closeDetailsModal() {
        // Leave WebSocket room
        if (this.currentTournament && window.WebSocketManager) {
            WebSocketManager.leaveTournament(this.currentTournament.id);
        }
        UI.closeModal('tournament-details-modal');
    },

    // WebSocket data render methods
    renderStandingsFromData(standings) {
        const container = document.getElementById('tournament-standings-container');
        const table = document.getElementById('tournament-standings-table');
        const noStandings = document.getElementById('tournament-no-standings');

        if (!standings || standings.length === 0) {
            container.style.display = 'none';
            noStandings.style.display = 'flex';
            return;
        }

        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; color: white;">
                <thead>
                    <tr style="background: rgba(46, 204, 113, 0.2); text-align: left;">
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1);">${I18n.t('stats.rank')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1);">${I18n.t('stats.team')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.played')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.won')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.drawn')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.lost')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalsFor')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalsAgainst')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalDifference')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center; font-weight: bold;">${I18n.t('stats.points')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${standings.map((team, index) => `
                        <tr style="background: ${index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};">
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">${index + 1}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="
                                        width: 30px;
                                        height: 30px;
                                        background: ${team.team_color || '#2ecc71'};
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-weight: bold;
                                        font-size: 12px;
                                    ">${team.team_logo || team.team_name.substring(0, 2).toUpperCase()}</div>
                                    <span>${team.team_name}</span>
                                </div>
                            </td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.played}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #2ecc71;">${team.won}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #f39c12;">${team.drawn}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #e74c3c;">${team.lost}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.goals_for}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.goals_against}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: ${team.goal_difference >= 0 ? '#2ecc71' : '#e74c3c'};">${team.goal_difference > 0 ? '+' : ''}${team.goal_difference}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; font-weight: bold; color: #2ecc71; font-size: 16px;">${team.points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.style.display = 'block';
        noStandings.style.display = 'none';
    },

    renderStatisticsFromData(statistics) {
        const container = document.getElementById('tournament-statistics-container');
        const list = document.getElementById('tournament-statistics-list');
        const noStats = document.getElementById('tournament-no-statistics');

        if (!statistics || statistics.length === 0) {
            container.style.display = 'none';
            noStats.style.display = 'flex';
            return;
        }

        const topScorers = statistics.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 10);

        list.innerHTML = `
            <div style="margin-bottom: 32px;">
                <h4 style="color: #2ecc71; margin-bottom: 16px;"><i class="fas fa-futbol"></i> ${I18n.t('stats.topScorers')}</h4>
                ${topScorers.length > 0 ? `
                    <div style="display: grid; gap: 8px;">
                        ${topScorers.map((player, index) => `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 12px;
                                background: rgba(255,255,255,0.05);
                                border-radius: 8px;
                            ">
                                <div style="display: flex; align-items: center; gap: 12px;">
                                    <span style="
                                        width: 28px;
                                        height: 28px;
                                        background: ${index < 3 ? '#f39c12' : 'rgba(255,255,255,0.1)'};
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-weight: bold;
                                        font-size: 12px;
                                    ">${index + 1}</span>
                                    <div>
                                        <div style="color: white; font-weight: 600;">${player.player_name}</div>
                                        <div style="color: #b0b0b0; font-size: 12px;">${player.team_name}</div>
                                    </div>
                                </div>
                                <div style="font-size: 20px; font-weight: bold; color: #2ecc71;">${player.goals}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : `<p style="color: #b0b0b0;">${I18n.t('stats.noGoalsScored')}</p>`}
            </div>

            <div style="margin-bottom: 32px;">
                <h4 style="color: #f39c12; margin-bottom: 16px;"><i class="fas fa-square"></i> ${I18n.t('stats.yellowCards')}</h4>
                ${statistics.filter(s => s.yellow_cards > 0).length > 0 ? `
                    <div style="display: grid; gap: 8px;">
                        ${statistics.filter(s => s.yellow_cards > 0).sort((a, b) => b.yellow_cards - a.yellow_cards).slice(0, 5).map(player => `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 12px;
                                background: rgba(255,255,255,0.05);
                                border-radius: 8px;
                            ">
                                <div>
                                    <div style="color: white; font-weight: 600;">${player.player_name}</div>
                                    <div style="color: #b0b0b0; font-size: 12px;">${player.team_name}</div>
                                </div>
                                <div style="font-size: 18px; font-weight: bold; color: #f39c12;">${player.yellow_cards}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : `<p style="color: #b0b0b0;">${I18n.t('stats.noYellowCards')}</p>`}
            </div>

            <div>
                <h4 style="color: #e74c3c; margin-bottom: 16px;"><i class="fas fa-square"></i> ${I18n.t('stats.redCards')}</h4>
                ${statistics.filter(s => s.red_cards > 0).length > 0 ? `
                    <div style="display: grid; gap: 8px;">
                        ${statistics.filter(s => s.red_cards > 0).sort((a, b) => b.red_cards - a.red_cards).slice(0, 5).map(player => `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 12px;
                                background: rgba(255,255,255,0.05);
                                border-radius: 8px;
                            ">
                                <div>
                                    <div style="color: white; font-weight: 600;">${player.player_name}</div>
                                    <div style="color: #b0b0b0; font-size: 12px;">${player.team_name}</div>
                                </div>
                                <div style="font-size: 18px; font-weight: bold; color: #e74c3c;">${player.red_cards}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : `<p style="color: #b0b0b0;">${I18n.t('stats.noRedCards')}</p>`}
            </div>
        `;

        container.style.display = 'block';
        noStats.style.display = 'none';
    },

    closeFixturesSettingsModal() {
        UI.closeModal('fixtures-settings-modal');
        document.getElementById('fixtures-settings-form').reset();
    },

    closeMatchResultsModal() {
        UI.closeModal('match-results-modal');
        this.currentMatch = null;
        document.getElementById('update-score-form').reset();
        document.getElementById('add-goal-form').reset();
        document.getElementById('add-card-form').reset();
    },

    async updateJoinButton(tournament) {
        const joinBtn = document.getElementById('join-tournament-btn');
        const joinStatus = document.getElementById('join-tournament-status');
        const joinStatusText = document.getElementById('join-status-text');

        joinBtn.style.display = 'none';
        joinStatus.style.display = 'none';

        if (!API.isAuthenticated()) {
            return;
        }

        const user = API.getUser();

        if (user.role !== 'coach') {
            return;
        }

        try {
            const response = await API.checkTournamentJoined(tournament.id);

            if (response.joined) {
                joinStatusText.textContent = I18n.t('tournaments.teamParticipating');
                joinStatus.style.color = '#2ecc71';
                joinStatus.style.display = 'block';
                return;
            }

            if (!response.hasTeam) {
                joinStatusText.textContent = I18n.t('tournaments.needTeamFirst');
                joinStatus.style.color = '#f39c12';
                joinStatus.querySelector('i').className = 'fas fa-exclamation-triangle';
                joinStatus.style.display = 'block';
                return;
            }

        } catch (error) {
            console.error('Check join error:', error);
        }

        const currentTeams = tournament.teams_count || 0;
        const maxTeams = tournament.max_teams;

        if (currentTeams < maxTeams) {
            joinBtn.style.display = 'inline-flex';
            joinBtn.onclick = () => this.handleJoinTournament(tournament.id);
        } else {
            joinStatusText.textContent = I18n.t('tournaments.tournamentFull');
            joinStatus.style.color = '#e74c3c';
            joinStatus.querySelector('i').className = 'fas fa-times-circle';
            joinStatus.style.display = 'block';
        }
    },

    async updateGenerateFixturesButton(tournament) {
        const generateBtn = document.getElementById('generate-fixtures-btn');

        if (!generateBtn) return;

        generateBtn.style.display = 'none';

        if (!API.isAuthenticated()) return;

        const user = API.getUser();

        if (user.role !== 'organizer') return;
        if (tournament.organizer_id !== user.id) return;

        generateBtn.style.display = 'inline-flex';
        generateBtn.onclick = () => this.openGenerateFixturesModal(tournament);
    },

    async handleJoinTournament(tournamentId) {
        const joinBtn = document.getElementById('join-tournament-btn');

        joinBtn.disabled = true;
        const originalHTML = joinBtn.innerHTML;
        joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Joining...';

        try {
            await API.joinTournament(tournamentId);

            UI.showNotification(I18n.t('tournaments.joinSuccess'), 'success');

            this.closeDetailsModal();
            await this.load();

        } catch (error) {
            console.error('Join error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.joinFailed'), 'error');

            joinBtn.innerHTML = originalHTML;
            joinBtn.disabled = false;
        }
    },

    openGenerateFixturesModal(tournament) {
        this.currentTournament = tournament;
        this.closeDetailsModal();
        UI.openModal('fixtures-settings-modal');
    },

    async handleGenerateFixtures(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);

        try {
            const matchDays = Array.from(document.querySelectorAll('input[name="match-days"]:checked'))
                .map(cb => parseInt(cb.value));

            if (matchDays.length === 0) {
                throw new Error(I18n.t('fixturesSettings.selectAtLeastOneDay'));
            }

            const data = {
                startDate: document.getElementById('fixtures-start-date').value,
                matchTime: document.getElementById('fixtures-match-time').value,
                matchDays: matchDays,
                matchesPerDay: parseInt(document.getElementById('fixtures-matches-per-day').value),
                daysBetweenRounds: 0,
                venue: document.getElementById('fixtures-venue').value || 'TBD'
            };

            const response = await API.request(`/tournaments/${this.currentTournament.id}/fixtures/generate`, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            UI.showNotification(I18n.t('messages.success.fixturesGenerated'), 'success');
            this.closeFixturesSettingsModal();
            await this.load();

        } catch (error) {
            console.error('Generate fixtures error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.generateFixturesFailed'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async loadTournamentFixtures(tournamentId) {
        const fixturesContainer = document.getElementById('tournament-fixtures-container');
        const fixturesList = document.getElementById('tournament-fixtures-list');
        const noFixtures = document.getElementById('tournament-no-fixtures');

        try {
            const response = await API.getTournamentMatches(tournamentId);
            const matches = response.matches || [];

            if (matches.length === 0) {
                fixturesContainer.style.display = 'none';
                noFixtures.style.display = 'flex';
                return;
            }

            const rounds = {};
            matches.forEach(match => {
                if (!rounds[match.round]) {
                    rounds[match.round] = [];
                }
                rounds[match.round].push(match);
            });

            fixturesList.innerHTML = '';

            Object.keys(rounds).sort((a, b) => a - b).forEach(roundNum => {
                const roundMatches = rounds[roundNum];

                const roundDiv = document.createElement('div');
                roundDiv.style.marginBottom = '24px';

                roundDiv.innerHTML = `
                    <h4 style="color: #2ecc71; margin-bottom: 12px;">
                        ${I18n.t('tournaments.round', { num: roundNum })}
                    </h4>
                    <div style="display: grid; gap: 12px;">
                        ${roundMatches.map(match => this.createFixtureCard(match, tournamentId)).join('')}
                    </div>
                `;

                fixturesList.appendChild(roundDiv);
            });

            fixturesContainer.style.display = 'block';
            noFixtures.style.display = 'none';

        } catch (error) {
            console.error('Failed to load fixtures:', error);
            fixturesContainer.style.display = 'none';
            noFixtures.style.display = 'flex';
        }
    },

    createFixtureCard(match, tournamentId) {
        const dateStr = I18n.formatDate(match.match_date);
        const timeStr = I18n.formatTime(match.match_date);

        const user = API.getUser();
        const isOrganizer = user && user.role === 'organizer' && match.organizer_id === user.id;

        return `
            <div data-match-id="${match.id}" style="
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 16px;
            ">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: ${match.home_team_color};
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            color: white;
                            font-size: 14px;
                        ">
                            ${match.home_team_logo}
                        </div>
                        <span style="color: white; font-weight: 600;">${match.home_team_name}</span>
                    </div>

                    <div style="text-align: center; padding: 0 24px;">
                        ${match.status === 'finished' ? `
                            <div class="match-score" style="color: #2ecc71; font-weight: bold; font-size: 24px;">
                                ${match.home_score} - ${match.away_score}
                            </div>
                        ` : `
                            <div class="match-score" style="color: #2ecc71; font-weight: bold; font-size: 18px;">${I18n.t('common.vs')}</div>
                        `}
                        <div style="color: #b0b0b0; font-size: 12px; margin-top: 4px;">${dateStr}</div>
                        <div style="color: #b0b0b0; font-size: 12px;">${timeStr}</div>
                        ${match.venue !== 'TBD' ? `<div style="color: #b0b0b0; font-size: 11px;"><i class="fas fa-map-marker-alt"></i> ${match.venue}</div>` : ''}
                    </div>

                    <div style="flex: 1; display: flex; align-items: center; gap: 12px; justify-content: flex-end;">
                        <span style="color: white; font-weight: 600;">${match.away_team_name}</span>
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: ${match.away_team_color};
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            color: white;
                            font-size: 14px;
                        ">
                            ${match.away_team_logo}
                        </div>
                    </div>
                </div>

                ${isOrganizer && match.status !== 'finished' ? `
                    <div style="margin-top: 16px; text-align: center;">
                        <button
                            class="btn btn-primary btn-sm"
                            onclick="Tournaments.openMatchResultsModal(${tournamentId}, ${match.id}); event.stopPropagation();"
                        >
                            <i class="fas fa-edit"></i> ${I18n.t('match.enterResults')}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    async openMatchResultsModal(tournamentId, matchId) {
        try {
            const response = await API.getMatchDetails(tournamentId, matchId);
            this.currentMatch = response.match;

            document.getElementById('match-home-logo').textContent = this.currentMatch.home_team_logo;
            document.getElementById('match-home-logo').style.color = this.currentMatch.home_team_color;
            document.getElementById('match-home-name').textContent = this.currentMatch.home_team_name;

            document.getElementById('match-away-logo').textContent = this.currentMatch.away_team_logo;
            document.getElementById('match-away-logo').style.color = this.currentMatch.away_team_color;
            document.getElementById('match-away-name').textContent = this.currentMatch.away_team_name;

            document.getElementById('home-score').value = this.currentMatch.home_score || 0;
            document.getElementById('away-score').value = this.currentMatch.away_score || 0;

            this.loadMatchEvents();

            this.closeDetailsModal();
            UI.openModal('match-results-modal');

        } catch (error) {
            console.error('Failed to open match results:', error);
            UI.showNotification(I18n.t('messages.error.loadMatchDetails'), 'error');
        }
    },

    loadMatchEvents() {
        const eventsList = document.getElementById('match-events-list');

        if (!this.currentMatch || !this.currentMatch.events || this.currentMatch.events.length === 0) {
            eventsList.innerHTML = `<p style="color: #b0b0b0; text-align: center;">${I18n.t('match.noEvents')}</p>`;
            return;
        }

        eventsList.innerHTML = this.currentMatch.events.map(event => {
            const iconMap = {
                'goal': 'fa-futbol',
                'yellow_card': 'fa-square',
                'red_card': 'fa-square',
                'substitution': 'fa-exchange-alt'
            };

            const colorMap = {
                'goal': '#2ecc71',
                'yellow_card': '#f39c12',
                'red_card': '#e74c3c',
                'substitution': '#3498db'
            };

            return `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    margin-bottom: 8px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 8px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: ${colorMap[event.event_type]};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                    ">
                        <i class="fas ${iconMap[event.event_type]}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="color: white; font-weight: 600;">${event.player_name}</div>
                        <div style="color: #b0b0b0; font-size: 14px;">${event.team_name}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="color: #2ecc71; font-weight: bold; font-size: 18px;">${event.minute}'</div>
                        <div style="color: #b0b0b0; font-size: 12px; text-transform: capitalize;">
                            ${event.event_type.replace('_', ' ')}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    async handleUpdateScore(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);

        try {
            const homeScore = parseInt(document.getElementById('home-score').value);
            const awayScore = parseInt(document.getElementById('away-score').value);

            await API.updateMatchResult(
                this.currentMatch.tournament_id,
                this.currentMatch.id,
                {
                    homeScore,
                    awayScore,
                    status: 'finished'
                }
            );

            this.currentMatch.home_score = homeScore;
            this.currentMatch.away_score = awayScore;
            this.currentMatch.status = 'finished';

            UI.showNotification(I18n.t('match.scoreUpdated'), 'success');

        } catch (error) {
            console.error('Update score error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.updateScoreFailed'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async handleAddGoal(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);

        try {
            const teamType = document.getElementById('goal-team').value;
            const playerEmail = document.getElementById('goal-player-email').value;
            const minute = parseInt(document.getElementById('goal-minute').value);
            const assistEmail = document.getElementById('goal-assist-email').value;

            if (!teamType || !playerEmail) {
                throw new Error(I18n.t('messages.error.teamAndPlayerRequired'));
            }

            const teamId = teamType === 'home' ? this.currentMatch.home_team_id : this.currentMatch.away_team_id;

            const eventData = {
                teamId,
                playerEmail,
                eventType: 'goal',
                minute,
                description: assistEmail ? `Assist by ${assistEmail}` : null
            };

            await API.addMatchEvent(
                this.currentMatch.tournament_id,
                this.currentMatch.id,
                eventData
            );

            UI.showNotification(I18n.t('match.goalAdded'), 'success');

            const response = await API.getMatchDetails(this.currentMatch.tournament_id, this.currentMatch.id);
            this.currentMatch = response.match;
            this.loadMatchEvents();

            form.reset();

        } catch (error) {
            console.error('Add goal error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.addGoalFailed'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async handleAddCard(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);

        try {
            const teamType = document.getElementById('card-team').value;
            const playerEmail = document.getElementById('card-player-email').value;
            const cardType = document.getElementById('card-type').value;
            const minute = parseInt(document.getElementById('card-minute').value);

            if (!teamType || !playerEmail || !cardType) {
                throw new Error(I18n.t('messages.error.allFieldsRequired'));
            }

            const teamId = teamType === 'home' ? this.currentMatch.home_team_id : this.currentMatch.away_team_id;

            const eventData = {
                teamId,
                playerEmail,
                eventType: cardType,
                minute
            };

            await API.addMatchEvent(
                this.currentMatch.tournament_id,
                this.currentMatch.id,
                eventData
            );

            UI.showNotification(I18n.t('match.cardAdded'), 'success');

            const response = await API.getMatchDetails(this.currentMatch.tournament_id, this.currentMatch.id);
            this.currentMatch = response.match;
            this.loadMatchEvents();

            form.reset();

        } catch (error) {
            console.error('Add card error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.addCardFailed'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async handleCreate(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        UI.showButtonLoading(submitBtn);

        try {
            const tournamentData = {
                name: document.getElementById('tournament-name').value.trim(),
                type: document.getElementById('tournament-type').value,
                startDate: document.getElementById('tournament-start-date').value,
                endDate: document.getElementById('tournament-end-date').value,
                location: document.getElementById('tournament-location').value.trim(),
                description: document.getElementById('tournament-description').value.trim(),
                maxTeams: parseInt(document.getElementById('tournament-max-teams').value),
            };

            await API.createTournament(tournamentData);

            UI.showNotification(I18n.t('messages.success.tournamentCreated'), 'success');

            this.closeCreateModal();
            await this.load();

        } catch (error) {
            console.error('Failed to create tournament:', error);
            UI.showNotification(error.message || I18n.t('messages.error.createTournament'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

};

window.Tournaments = Tournaments;
