// ============================================
// TEAMS MODULE
// Team management functionality
// ============================================

const Teams = {

    teams: [],
    currentTeamId: null,

    init() {
        this.createModals();
        this.attachEventListeners();
        this.load();

        if (window.I18n) {
            I18n.applyTranslations();
        }

        window.addEventListener('languageChanged', () => {
            if (window.I18n) {
                I18n.applyTranslations();
            }
            this.render();
        });
    },

    createModals() {
        const modalsHTML = `
            <!-- Create Team Modal -->
            <div class="modal" id="create-team-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-create-team">&times;</button>

                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-users"></i> <span data-i18n="teams.createTeam">Create Team</span>
                    </h2>

                    <form id="create-team-form">
                        <div class="form-group">
                            <label class="form-label" data-i18n="teams.teamName">Team Name</label>
                            <input
                                type="text"
                                class="form-input"
                                id="team-name"
                                data-i18n-placeholder="teams.teamNamePlaceholder"
                                placeholder="FC Barcelona"
                                minlength="3"
                                maxlength="100"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="teams.logoColor">Team Color</label>
                            <div style="display: flex; align-items: center; gap: 16px;">
                                <input
                                    type="color"
                                    class="form-input"
                                    id="team-color"
                                    value="#2ecc71"
                                    style="width: 60px; height: 40px; padding: 2px; cursor: pointer;"
                                >
                                <div id="team-logo-preview" style="
                                    width: 50px;
                                    height: 50px;
                                    border-radius: 50%;
                                    background: #2ecc71;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    font-size: 20px;
                                    font-weight: bold;
                                    color: white;
                                ">FC</div>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.description">Description</label>
                            <textarea
                                class="form-textarea"
                                id="team-description"
                                data-i18n-placeholder="tournaments.descriptionPlaceholder"
                                placeholder="Tell about your team..."
                                rows="3"
                            ></textarea>
                        </div>

                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Teams.closeCreateModal()">
                                <span data-i18n="common.cancel">Cancel</span>
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text" data-i18n="teams.createTeam">Create Team</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Team Details Modal -->
            <div class="modal" id="team-details-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content modal-content-large">
                    <button class="modal-close" id="close-team-details">&times;</button>

                    <div style="display: flex; align-items: center; gap: 24px; margin-bottom: 32px;">
                        <div
                            id="modal-team-logo"
                            style="
                                width: 80px;
                                height: 80px;
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                font-size: 32px;
                                font-weight: bold;
                                color: white;
                                background: #2ecc71;
                                flex-shrink: 0;
                            "
                        >T</div>
                        <div>
                            <h2 style="color: white; margin: 0 0 8px 0;" id="modal-team-name">Team Name</h2>
                            <p style="color: #b0b0b0; margin: 0 0 4px 0;">
                                <i class="fas fa-user"></i>
                                <span data-i18n="teams.coach">Coach</span>: <span id="modal-team-coach">Unknown</span>
                            </p>
                            <p style="color: #b0b0b0; margin: 0;" id="modal-team-tournament-info"></p>
                        </div>
                    </div>

                    <p style="color: #b0b0b0; line-height: 1.6; margin-bottom: 24px;" id="modal-team-description"></p>

                    <!-- Team Stats: 6 cards -->
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 32px;">
                        <div class="stat-card-mini">
                            <div class="stat-card-mini-number" id="modal-team-stat-matches">0</div>
                            <div class="stat-card-mini-label" data-i18n="teams.matches">Matches</div>
                        </div>
                        <div class="stat-card-mini">
                            <div class="stat-card-mini-number" id="modal-team-stat-wins">0</div>
                            <div class="stat-card-mini-label" data-i18n="teams.wins">Wins</div>
                        </div>
                        <div class="stat-card-mini">
                            <div class="stat-card-mini-number" id="modal-team-stat-draws">0</div>
                            <div class="stat-card-mini-label" data-i18n="teams.draws">Draws</div>
                        </div>
                        <div class="stat-card-mini">
                            <div class="stat-card-mini-number" id="modal-team-stat-losses">0</div>
                            <div class="stat-card-mini-label" data-i18n="teams.losses">Losses</div>
                        </div>
                        <div class="stat-card-mini">
                            <div class="stat-card-mini-number" id="modal-team-stat-gf">0</div>
                            <div class="stat-card-mini-label" data-i18n="teams.goalsFor">Goals For</div>
                        </div>
                        <div class="stat-card-mini">
                            <div class="stat-card-mini-number" id="modal-team-stat-ga">0</div>
                            <div class="stat-card-mini-label" data-i18n="teams.goalsAgainst">Goals Against</div>
                        </div>
                    </div>

                    <!-- Players Section -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: white; margin: 0;">
                            <i class="fas fa-users"></i> <span data-i18n="teams.teamPlayers">Team Players</span>
                            (<span id="modal-team-players-count">0</span>/25)
                        </h3>
                        <button class="btn btn-primary btn-sm" id="add-player-btn" style="display: none;">
                            <i class="fas fa-plus"></i> <span data-i18n="teams.addPlayer">Add Player</span>
                        </button>
                    </div>

                    <div id="players-container">
                        <div class="empty-state">
                            <div class="empty-icon"><i class="fas fa-users"></i></div>
                            <h3 class="empty-title" data-i18n="teams.noPlayers">No players yet</h3>
                            <p class="empty-subtitle" data-i18n="teams.addPlayersCta">Add players to your team!</p>
                        </div>
                    </div>

                    <!-- Delete Team Button (for coach, when allowed) -->
                    <div id="team-actions-container" style="margin-top: 24px; text-align: center; display: none;">
                        <button class="btn btn-danger btn-sm" id="delete-team-btn">
                            <i class="fas fa-trash"></i> <span data-i18n="teams.deleteTeam">Delete Team</span>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Add Player Modal -->
            <div class="modal" id="add-player-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-add-player">&times;</button>

                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-user-plus"></i> <span data-i18n="teams.addPlayer">Add Player</span>
                    </h2>

                    <!-- Search Section -->
                    <div class="form-group">
                        <label class="form-label" data-i18n="addPlayer.searchPlayer">Search Player</label>
                        <input
                            type="text"
                            class="form-input"
                            id="search-player-query"
                            data-i18n-placeholder="addPlayer.searchPlaceholder"
                            placeholder="Name or email..."
                            minlength="2"
                        >
                        <button type="button" class="btn btn-primary" style="width: 100%; margin-top: 8px;" onclick="Teams.searchPlayers()">
                            <i class="fas fa-search"></i> <span data-i18n="addPlayer.search">Search</span>
                        </button>
                    </div>

                    <!-- Search Results -->
                    <div id="search-results" style="margin: 24px 0; display: none;">
                        <h4 style="color: white; margin-bottom: 12px;" data-i18n="addPlayer.searchResults">Search Results:</h4>
                        <div id="players-search-list"></div>
                    </div>

                    <!-- Add Player Form -->
                    <div id="add-player-form-container" style="display: none;">
                        <hr style="border-color: rgba(255,255,255,0.1); margin: 24px 0;">

                        <h4 style="color: white; margin-bottom: 16px;" data-i18n="addPlayer.playerDetails">Player Details:</h4>

                        <div style="background: rgba(46, 204, 113, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <div style="color: white; font-weight: 600;" id="selected-player-name">-</div>
                            <div style="color: #b0b0b0; font-size: 14px;" id="selected-player-email">-</div>
                        </div>

                        <form id="add-player-form">
                            <input type="hidden" id="selected-player-id">

                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label class="form-label" data-i18n="addPlayer.jerseyNumber">Jersey Number (1-99)</label>
                                    <input
                                        type="number"
                                        class="form-input"
                                        id="player-jersey"
                                        min="1"
                                        max="99"
                                        placeholder="10"
                                        required
                                    >
                                </div>

                                <div class="form-group">
                                    <label class="form-label" data-i18n="addPlayer.position">Position</label>
                                    <select class="form-select" id="player-position" required>
                                        <option value="" data-i18n="addPlayer.selectPosition">Select position</option>
                                        <option value="goalkeeper" data-i18n="addPlayer.positions.goalkeeper">Goalkeeper</option>
                                        <option value="defender" data-i18n="addPlayer.positions.defender">Defender</option>
                                        <option value="midfielder" data-i18n="addPlayer.positions.midfielder">Midfielder</option>
                                        <option value="forward" data-i18n="addPlayer.positions.forward">Forward</option>
                                    </select>
                                </div>
                            </div>

                            <div style="display: flex; gap: 16px; margin-top: 24px;">
                                <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Teams.closeAddPlayerModal()">
                                    <span data-i18n="common.cancel">Cancel</span>
                                </button>
                                <button type="submit" class="btn btn-primary" style="flex: 1;">
                                    <span class="btn-text" data-i18n="addPlayer.addToTeam">Add to Team</span>
                                    <div class="spinner" style="display: none;"></div>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalsHTML);
    },

    attachEventListeners() {
        const createBtn = document.getElementById('create-team-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.handleTeamButton());
        }

        document.getElementById('close-create-team')?.addEventListener('click', () => this.closeCreateModal());
        document.getElementById('close-team-details')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('close-add-player')?.addEventListener('click', () => this.closeAddPlayerModal());

        document.querySelector('#create-team-modal .modal-overlay')?.addEventListener('click', () => this.closeCreateModal());
        document.querySelector('#team-details-modal .modal-overlay')?.addEventListener('click', () => this.closeDetailsModal());
        document.querySelector('#add-player-modal .modal-overlay')?.addEventListener('click', () => this.closeAddPlayerModal());

        document.getElementById('create-team-form')?.addEventListener('submit', (e) => this.handleCreate(e));
        document.getElementById('add-player-form')?.addEventListener('submit', (e) => this.handleAddPlayer(e));
        document.getElementById('add-player-btn')?.addEventListener('click', () => this.openAddPlayerModal());
        document.getElementById('delete-team-btn')?.addEventListener('click', () => this.handleDeleteTeam());

        // Auto-update logo preview when name changes
        const nameInput = document.getElementById('team-name');
        const colorInput = document.getElementById('team-color');
        if (nameInput) {
            nameInput.addEventListener('input', () => this.updateLogoPreview());
        }
        if (colorInput) {
            colorInput.addEventListener('input', () => this.updateLogoPreview());
        }

        // Search on Enter key
        const searchInput = document.getElementById('search-player-query');
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.searchPlayers();
                }
            });
        }
    },

    updateLogoPreview() {
        const name = document.getElementById('team-name').value.trim();
        const color = document.getElementById('team-color').value;
        const preview = document.getElementById('team-logo-preview');
        if (preview) {
            preview.textContent = name.length >= 2 ? name.replace(/\s+/g, '').substring(0, 3).toUpperCase() : '--';
            preview.style.background = color;
        }
    },

    // Coach button: "Create Team" or "My Team"
    handleTeamButton() {
        if (!API.isAuthenticated()) {
            UI.showNotification(I18n.t('messages.error.unauthorized'), 'error');
            Auth.openAuthModal('login');
            return;
        }

        const user = API.getUser();
        if (user.role !== 'coach') {
            UI.showNotification(I18n.t('messages.error.onlyCoaches'), 'error');
            return;
        }

        // Check if coach already has a team
        const myTeam = this.teams.find(t => t.coach_id === user.id);

        if (myTeam) {
            // Open "My Team" details
            this.openDetailsModal(myTeam);
        } else {
            // Open create modal
            this.openCreateModal();
        }
    },

    updateTeamButton() {
        const btn = document.getElementById('create-team-btn');
        if (!btn) return;

        const user = API.getUser();
        if (!user || user.role !== 'coach') return;

        const myTeam = this.teams.find(t => t.coach_id === user.id);

        if (myTeam) {
            btn.innerHTML = `<i class="fas fa-users"></i> <span data-i18n="teams.myTeam">${window.I18n ? I18n.t('teams.myTeam') : 'My Team'}</span>`;
        } else {
            btn.innerHTML = `<i class="fas fa-plus"></i> <span data-i18n="teams.createTeam">${window.I18n ? I18n.t('teams.createTeam') : 'Create Team'}</span>`;
        }
    },

    async load() {
        UI.showLoading('teams-list');

        try {
            const response = await API.getTeams();
            this.teams = response.teams || [];

            this.updateStats();
            this.updateTeamButton();
            this.render();

        } catch (error) {
            console.error('Failed to load teams:', error);
            this.showEmpty();
        }
    },

    updateStats() {
        const total = this.teams.length;
        const totalPlayers = this.teams.reduce((sum, team) => sum + parseInt(team.players_count || 0), 0);

        document.getElementById('total-teams').textContent = total;
        document.getElementById('total-players').textContent = totalPlayers;
        document.getElementById('total-coaches').textContent = total;
    },

    render() {
        const container = document.getElementById('teams-list');
        const emptyState = document.getElementById('teams-empty');

        if (!container) return;

        UI.hideLoading('teams-list');

        if (this.teams.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'grid';
        if (emptyState) emptyState.style.display = 'none';

        container.innerHTML = '';

        this.teams.forEach(team => {
            const card = this.createCard(team);
            container.appendChild(card);
        });
    },

    createCard(team) {
        const card = document.createElement('div');
        card.className = 'card team-card';
        card.onclick = () => this.openDetailsModal(team);

        const tournamentHTML = team.tournament_name
            ? `<div class="team-info-item">
                    <i class="fas fa-trophy"></i>
                    <span>${team.tournament_name}</span>
                </div>`
            : '';

        card.innerHTML = `
            <div class="team-logo" style="background: ${team.logo_color || '#2ecc71'}">
                ${team.logo || team.name.replace(/\s+/g, '').substring(0, 3).toUpperCase()}
            </div>

            <h3 class="team-name">${team.name}</h3>

            <div class="team-info">
                <div class="team-info-item">
                    <i class="fas fa-user"></i>
                    <span>${team.coach_name || ''}</span>
                </div>
                <div class="team-info-item">
                    <i class="fas fa-users"></i>
                    <span>${team.players_count || 0}/25</span>
                </div>
                ${tournamentHTML}
            </div>
        `;

        return card;
    },

    showEmpty() {
        const container = document.getElementById('teams-list');
        const emptyState = document.getElementById('teams-empty');

        UI.hideLoading('teams-list');

        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
    },

    openCreateModal() {
        // Reset form
        document.getElementById('create-team-form').reset();
        document.getElementById('team-color').value = '#2ecc71';
        this.updateLogoPreview();
        UI.openModal('create-team-modal');
    },

    closeCreateModal() {
        UI.closeModal('create-team-modal');
        document.getElementById('create-team-form').reset();
    },

    async openDetailsModal(team) {
        this.currentTeamId = team.id;

        try {
            // Load full team data
            const response = await API.getTeamById(team.id);
            const fullTeam = response.team;

            document.getElementById('modal-team-name').textContent = fullTeam.name;
            document.getElementById('modal-team-coach').textContent = fullTeam.coach_name || '';

            const logo = document.getElementById('modal-team-logo');
            logo.textContent = fullTeam.logo || fullTeam.name.replace(/\s+/g, '').substring(0, 3).toUpperCase();
            logo.style.background = fullTeam.logo_color || '#2ecc71';

            // Tournament info
            const tournamentInfo = document.getElementById('modal-team-tournament-info');
            if (fullTeam.tournament_name) {
                tournamentInfo.innerHTML = `<i class="fas fa-trophy"></i> ${fullTeam.tournament_name}`;
                tournamentInfo.style.display = 'block';
            } else {
                tournamentInfo.style.display = 'none';
            }

            // Description
            const descEl = document.getElementById('modal-team-description');
            if (fullTeam.description) {
                descEl.textContent = fullTeam.description;
                descEl.style.display = 'block';
            } else {
                descEl.style.display = 'none';
            }

            // Stats
            const stats = fullTeam.stats || {};
            document.getElementById('modal-team-stat-matches').textContent = stats.total_matches || 0;
            document.getElementById('modal-team-stat-wins').textContent = stats.total_wins || 0;
            document.getElementById('modal-team-stat-draws').textContent = stats.total_draws || 0;
            document.getElementById('modal-team-stat-losses').textContent = stats.total_losses || 0;
            document.getElementById('modal-team-stat-gf').textContent = stats.total_goals_for || 0;
            document.getElementById('modal-team-stat-ga').textContent = stats.total_goals_against || 0;

            // Players count
            const players = fullTeam.players || [];
            document.getElementById('modal-team-players-count').textContent = players.length;

            // Show add player / delete team buttons only for coach of this team
            const user = API.getUser();
            const isCoach = user && user.role === 'coach' && fullTeam.coach_id === user.id;
            const isInActiveTournament = fullTeam.tournament_status === 'active';

            const addPlayerBtn = document.getElementById('add-player-btn');
            addPlayerBtn.style.display = (isCoach && !isInActiveTournament) ? 'inline-flex' : 'none';

            // Delete team: only if 0 players and no tournament
            const actionsContainer = document.getElementById('team-actions-container');
            actionsContainer.style.display = (isCoach && players.length === 0 && !fullTeam.tournament_id) ? 'block' : 'none';

            // Render players list (without email)
            this.renderPlayersList(players, isCoach && !isInActiveTournament, team.id);

            UI.openModal('team-details-modal');

        } catch (error) {
            console.error('Failed to load team details:', error);
            UI.showNotification(error.message || 'Failed to load team details', 'error');
        }
    },

    renderPlayersList(players, canRemove, teamId) {
        const container = document.getElementById('players-container');

        if (players.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-users"></i></div>
                    <h3 class="empty-title">${window.I18n ? I18n.t('teams.noPlayers') : 'No players yet'}</h3>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div style="display: grid; gap: 8px;">
                ${players.map(player => `
                    <div style="
                        background: rgba(46, 204, 113, 0.1);
                        border: 1px solid rgba(46, 204, 113, 0.3);
                        border-radius: 8px;
                        padding: 12px 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <div style="
                                width: 36px;
                                height: 36px;
                                background: var(--color-primary);
                                border-radius: 50%;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                                color: white;
                                font-weight: bold;
                                font-size: 14px;
                                flex-shrink: 0;
                            ">
                                ${player.jersey_number}
                            </div>
                            <div style="color: white; font-weight: 500;">
                                ${player.player_name}
                            </div>
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span style="
                                background: rgba(52, 152, 219, 0.2);
                                color: #3498db;
                                padding: 3px 10px;
                                border-radius: 12px;
                                font-size: 12px;
                                font-weight: 600;
                                text-transform: capitalize;
                            ">
                                ${player.position}
                            </span>
                            ${canRemove ? `
                                <button
                                    class="btn btn-secondary btn-sm"
                                    onclick="Teams.handleRemovePlayer(${teamId}, ${player.player_id})"
                                    style="padding: 6px 10px; min-width: auto;"
                                >
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    closeDetailsModal() {
        UI.closeModal('team-details-modal');
        this.currentTeamId = null;
    },

    openAddPlayerModal() {
        const searchInput = document.getElementById('search-player-query');
        if (searchInput) searchInput.value = '';
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('add-player-form-container').style.display = 'none';
        document.getElementById('add-player-form').reset();

        UI.openModal('add-player-modal');
    },

    closeAddPlayerModal() {
        UI.closeModal('add-player-modal');
    },

    async searchPlayers() {
        const query = document.getElementById('search-player-query').value.trim();

        if (query.length < 2) {
            UI.showNotification(window.I18n ? I18n.t('addPlayer.minChars') : 'Enter at least 2 characters', 'error');
            return;
        }

        try {
            const response = await API.request(`/teams/${this.currentTeamId}/players/search?query=${encodeURIComponent(query)}`);
            const players = response.players || [];

            const resultsContainer = document.getElementById('search-results');
            const playersList = document.getElementById('players-search-list');

            if (players.length === 0) {
                playersList.innerHTML = `
                    <div style="padding: 16px; text-align: center; color: #b0b0b0;">
                        ${window.I18n ? I18n.t('addPlayer.noPlayersFound') : 'No players found'}
                    </div>
                `;
            } else {
                playersList.innerHTML = players.map(player => `
                    <div style="
                        background: rgba(255, 255, 255, 0.05);
                        border: 1px solid rgba(255, 255, 255, 0.1);
                        border-radius: 8px;
                        padding: 12px;
                        margin-bottom: 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <div>
                            <div style="color: white; font-weight: 600;">${player.name}</div>
                            <div style="color: #b0b0b0; font-size: 14px;">${player.email}</div>
                            ${player.has_team ? `<div style="color: #e74c3c; font-size: 12px; margin-top: 4px;"><i class="fas fa-exclamation-circle"></i> ${window.I18n ? I18n.t('addPlayer.alreadyInTeam') : 'Already in a team'}</div>` : ''}
                        </div>
                        <button
                            class="btn btn-primary btn-sm"
                            onclick='Teams.selectPlayer(${JSON.stringify(player).replace(/'/g, "\\'")})'
                            ${player.has_team ? 'disabled' : ''}
                        >
                            ${window.I18n ? I18n.t('addPlayer.select') : 'Select'}
                        </button>
                    </div>
                `).join('');
            }

            resultsContainer.style.display = 'block';

        } catch (error) {
            console.error('Search failed:', error);
            UI.showNotification(error.message || 'Search failed', 'error');
        }
    },

    selectPlayer(player) {
        document.getElementById('selected-player-id').value = player.id;
        document.getElementById('selected-player-name').textContent = player.name;
        document.getElementById('selected-player-email').textContent = player.email;

        document.getElementById('add-player-form-container').style.display = 'block';
        document.getElementById('player-jersey').focus();
    },

    async handleAddPlayer(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        UI.showButtonLoading(submitBtn);

        try {
            const playerData = {
                playerId: parseInt(document.getElementById('selected-player-id').value),
                jerseyNumber: parseInt(document.getElementById('player-jersey').value),
                position: document.getElementById('player-position').value,
            };

            await API.addPlayerToTeam(this.currentTeamId, playerData);

            UI.showNotification(window.I18n ? I18n.t('addPlayer.playerAdded') : 'Player added', 'success');

            this.closeAddPlayerModal();

            // Reload team details
            const response = await API.getTeamById(this.currentTeamId);
            const fullTeam = response.team;
            const user = API.getUser();
            const isCoach = user && user.role === 'coach' && fullTeam.coach_id === user.id;
            this.renderPlayersList(fullTeam.players || [], isCoach, this.currentTeamId);
            document.getElementById('modal-team-players-count').textContent = (fullTeam.players || []).length;

            await this.load();

            // Refresh profile stats (player count)
            if (window.Auth && Auth.updateProfileStats) {
                Auth.updateProfileStats(API.getUser());
            }

        } catch (error) {
            console.error('Failed to add player:', error);
            UI.showNotification(error.message || 'Failed to add player', 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async handleRemovePlayer(teamId, playerId) {
        if (!confirm(window.I18n ? I18n.t('addPlayer.confirmRemove') : 'Remove this player?')) {
            return;
        }

        try {
            await API.removePlayerFromTeam(teamId, playerId);

            UI.showNotification(window.I18n ? I18n.t('addPlayer.playerRemoved') : 'Player removed', 'success');

            // Reload team details
            const response = await API.getTeamById(teamId);
            const fullTeam = response.team;
            const user = API.getUser();
            const isCoach = user && user.role === 'coach' && fullTeam.coach_id === user.id;
            this.renderPlayersList(fullTeam.players || [], isCoach, teamId);
            document.getElementById('modal-team-players-count').textContent = (fullTeam.players || []).length;

            // Update delete button visibility
            const actionsContainer = document.getElementById('team-actions-container');
            actionsContainer.style.display = (isCoach && (fullTeam.players || []).length === 0 && !fullTeam.tournament_id) ? 'block' : 'none';

            await this.load();

            // Refresh profile stats (player count)
            if (window.Auth && Auth.updateProfileStats) {
                Auth.updateProfileStats(API.getUser());
            }

        } catch (error) {
            console.error('Failed to remove player:', error);
            UI.showNotification(error.message || 'Failed to remove player', 'error');
        }
    },

    async handleDeleteTeam() {
        if (!confirm(window.I18n ? I18n.t('teams.confirmDelete') : 'Are you sure you want to delete this team?')) {
            return;
        }

        try {
            await API.request(`/teams/${this.currentTeamId}`, { method: 'DELETE' });

            UI.showNotification(window.I18n ? I18n.t('teams.teamDeleted') : 'Team deleted', 'success');
            this.closeDetailsModal();
            await this.load();

        } catch (error) {
            console.error('Failed to delete team:', error);
            UI.showNotification(error.message || 'Failed to delete team', 'error');
        }
    },

    async handleCreate(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        UI.showButtonLoading(submitBtn);

        try {
            const teamData = {
                name: document.getElementById('team-name').value.trim(),
                logoColor: document.getElementById('team-color').value,
                description: document.getElementById('team-description').value.trim() || null,
            };

            await API.createTeam(teamData);

            UI.showNotification(window.I18n ? I18n.t('messages.success.teamCreated') : 'Team created', 'success');

            this.closeCreateModal();
            await this.load();

            // Refresh profile section to show new team
            if (window.Auth && Auth.updateProfileStats) {
                Auth.updateProfileStats(API.getUser());
            }

            // Refresh statistics
            if (window.Statistics && Statistics.load) {
                Statistics.load();
            }

        } catch (error) {
            console.error('Failed to create team:', error);
            UI.showNotification(error.message || 'Failed to create team', 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

};

window.Teams = Teams;
