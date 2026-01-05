/* ==============================================
   TEAMS MODULE - Логика команд
   ============================================== */

const Teams = {
    
    teams: [],
    currentTeamId: null, // ՆՈՐ - ընթացիկ թիմի ID
    
    // ========== ИНИЦИАЛИЗАЦИЯ ==========
    
    init() {
        this.createModals();
        this.attachEventListeners();
        this.load();
        console.log('✅ Teams Module initialized');
    },
    
    // ========== СОЗДАНИЕ МОДАЛЬНЫХ ОКОН ==========
    
    createModals() {
        const modalsHTML = `
            <!-- Create Team Modal -->
            <div class="modal" id="create-team-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-create-team">&times;</button>
                    
                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-users"></i> Create Team
                    </h2>
                    
                    <form id="create-team-form">
                        <div class="form-group">
                            <label class="form-label">Team Name</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="team-name" 
                                placeholder="FC Barcelona"
                                required
                            >
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label">Logo (2-3 letters)</label>
                                <input 
                                    type="text" 
                                    class="form-input" 
                                    id="team-logo" 
                                    placeholder="FCB"
                                    maxlength="3"
                                    style="text-transform: uppercase;"
                                    required
                                >
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">Logo Color</label>
                                <input 
                                    type="color" 
                                    class="form-input" 
                                    id="team-color" 
                                    value="#2ecc71"
                                    required
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Stadium</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="team-stadium" 
                                placeholder="Camp Nou"
                            >
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea 
                                class="form-textarea" 
                                id="team-description" 
                                placeholder="Tell about your team..."
                                rows="4"
                            ></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Maximum Players</label>
                            <select class="form-select" id="team-max-players" required>
                                <option value="11">11 players</option>
                                <option value="15">15 players</option>
                                <option value="18">18 players</option>
                                <option value="20">20 players</option>
                                <option value="25" selected>25 players</option>
                            </select>
                        </div>
                        
                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Teams.closeCreateModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text">Create Team</span>
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
                            "
                        >
                            T
                        </div>
                        <div>
                            <h2 style="color: white; margin: 0 0 8px 0;" id="modal-team-name">Team Name</h2>
                            <p style="color: #b0b0b0; margin: 0;">
                                <i class="fas fa-user"></i>
                                Coach: <span id="modal-team-coach">Unknown</span>
                            </p>
                        </div>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-building"></i>
                            <span>Stadium: <span id="modal-team-stadium">Not specified</span></span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-users"></i>
                            <span>Players: <span id="modal-team-players">0</span></span>
                        </div>
                    </div>
                    
                    <p style="color: #b0b0b0; line-height: 1.6; margin-bottom: 32px;" id="modal-team-description">
                        No description provided
                    </p>
                    
                    <!-- Team Stats -->
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px;">
                        <div style="background: rgba(46, 204, 113, 0.1); border: 2px solid rgba(46, 204, 113, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 32px; font-weight: bold; color: #2ecc71;" id="modal-team-stat-matches">0</div>
                            <div style="color: #b0b0b0; font-size: 14px; margin-top: 8px;">Matches</div>
                        </div>
                        <div style="background: rgba(46, 204, 113, 0.1); border: 2px solid rgba(46, 204, 113, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 32px; font-weight: bold; color: #2ecc71;" id="modal-team-stat-wins">0</div>
                            <div style="color: #b0b0b0; font-size: 14px; margin-top: 8px;">Wins</div>
                        </div>
                        <div style="background: rgba(46, 204, 113, 0.1); border: 2px solid rgba(46, 204, 113, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 32px; font-weight: bold; color: #2ecc71;" id="modal-team-stat-draws">0</div>
                            <div style="color: #b0b0b0; font-size: 14px; margin-top: 8px;">Draws</div>
                        </div>
                        <div style="background: rgba(46, 204, 113, 0.1); border: 2px solid rgba(46, 204, 113, 0.3); border-radius: 12px; padding: 20px; text-align: center;">
                            <div style="font-size: 32px; font-weight: bold; color: #2ecc71;" id="modal-team-stat-losses">0</div>
                            <div style="color: #b0b0b0; font-size: 14px; margin-top: 8px;">Losses</div>
                        </div>
                    </div>
                    
                    <!-- Players Section (ՆՈՐ) -->
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="color: white; margin: 0;">
                            <i class="fas fa-users"></i> Team Players
                        </h3>
                        <button class="btn btn-primary btn-sm" id="add-player-btn" style="display: none;">
                            <i class="fas fa-plus"></i> Add Player
                        </button>
                    </div>
                    
                    <div id="players-container">
                        <div class="empty-state">
                            <div class="empty-icon"><i class="fas fa-users"></i></div>
                            <h3 class="empty-title">No players yet</h3>
                            <p class="empty-subtitle">Add players to your team!</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Add Player Modal (ՆՈՐ) -->
            <div class="modal" id="add-player-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-add-player">&times;</button>
                    
                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-user-plus"></i> Add Player
                    </h2>
                    
                    <!-- Search Section -->
                    <div class="form-group">
                        <label class="form-label">Search Player by Email</label>
                        <input 
                            type="email" 
                            class="form-input" 
                            id="search-player-email" 
                            placeholder="player@email.com"
                        >
                        <button type="button" class="btn btn-primary" style="width: 100%; margin-top: 8px;" onclick="Teams.searchPlayers()">
                            <i class="fas fa-search"></i> Search
                        </button>
                    </div>
                    
                    <!-- Search Results -->
                    <div id="search-results" style="margin: 24px 0; display: none;">
                        <h4 style="color: white; margin-bottom: 12px;">Search Results:</h4>
                        <div id="players-search-list"></div>
                    </div>
                    
                    <!-- Add Player Form -->
                    <div id="add-player-form-container" style="display: none;">
                        <hr style="border-color: rgba(255,255,255,0.1); margin: 24px 0;">
                        
                        <h4 style="color: white; margin-bottom: 16px;">Player Details:</h4>
                        
                        <div style="background: rgba(46, 204, 113, 0.1); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                            <div style="color: white; font-weight: 600;" id="selected-player-name">-</div>
                            <div style="color: #b0b0b0; font-size: 14px;" id="selected-player-email">-</div>
                        </div>
                        
                        <form id="add-player-form">
                            <input type="hidden" id="selected-player-id">
                            
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                <div class="form-group">
                                    <label class="form-label">Jersey Number (1-99)</label>
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
                                    <label class="form-label">Position</label>
                                    <select class="form-select" id="player-position" required>
                                        <option value="">Select position</option>
                                        <option value="goalkeeper">Goalkeeper</option>
                                        <option value="defender">Defender</option>
                                        <option value="midfielder">Midfielder</option>
                                        <option value="forward">Forward</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div style="display: flex; gap: 16px; margin-top: 24px;">
                                <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Teams.closeAddPlayerModal()">
                                    Cancel
                                </button>
                                <button type="submit" class="btn btn-primary" style="flex: 1;">
                                    <span class="btn-text">Add to Team</span>
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
    
    // ========== EVENT LISTENERS ==========
    
    attachEventListeners() {
        // Create Team button
        const createBtn = document.getElementById('create-team-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateModal());
        }
        
        // Close modals
        document.getElementById('close-create-team')?.addEventListener('click', () => this.closeCreateModal());
        document.getElementById('close-team-details')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('close-add-player')?.addEventListener('click', () => this.closeAddPlayerModal());
        
        // Close on overlay
        document.querySelector('#create-team-modal .modal-overlay')?.addEventListener('click', () => this.closeCreateModal());
        document.querySelector('#team-details-modal .modal-overlay')?.addEventListener('click', () => this.closeDetailsModal());
        document.querySelector('#add-player-modal .modal-overlay')?.addEventListener('click', () => this.closeAddPlayerModal());
        
        // Form submissions
        document.getElementById('create-team-form')?.addEventListener('submit', (e) => this.handleCreate(e));
        document.getElementById('add-player-form')?.addEventListener('submit', (e) => this.handleAddPlayer(e));
        
        // Add Player button
        document.getElementById('add-player-btn')?.addEventListener('click', () => this.openAddPlayerModal());
        
        // Logo input - uppercase
        const logoInput = document.getElementById('team-logo');
        if (logoInput) {
            logoInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.toUpperCase();
            });
        }
    },
    
    // ========== ЗАГРУЗКА КОМАНД ==========
    
    async load() {
        console.log('📥 Loading teams...');
        
        UI.showLoading('teams-list');
        
        try {
            const response = await API.getTeams();
            this.teams = response.teams || [];
            
            console.log('✅ Teams loaded:', this.teams.length);
            
            this.updateStats();
            this.render();
            
        } catch (error) {
            console.error('❌ Failed to load teams:', error);
            UI.showNotification(CONFIG.MESSAGES.ERROR.LOAD_TEAMS, 'error');
            this.showEmpty();
        }
    },
    
    // ========== ОБНОВЛЕНИЕ СТАТИСТИКИ ==========
    
    updateStats() {
        const total = this.teams.length;
        const totalPlayers = this.teams.reduce((sum, team) => sum + parseInt(team.players_count || 0), 0);
        const totalCoaches = this.teams.length;
        
        document.getElementById('total-teams').textContent = total;
        document.getElementById('total-players').textContent = totalPlayers;
        document.getElementById('total-coaches').textContent = totalCoaches;
    },
    
    // ========== ОТОБРАЖЕНИЕ КОМАНД ==========
    
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
    
    // ========== СОЗДАНИЕ КАРТОЧКИ ==========
    
    createCard(team) {
        const card = document.createElement('div');
        card.className = 'card team-card';
        card.onclick = () => this.openDetailsModal(team);
        
        card.innerHTML = `
            <div class="team-logo" style="background: ${team.logo_color || '#2ecc71'}">
                ${team.logo || team.name.substring(0, 2).toUpperCase()}
            </div>
            
            <h3 class="team-name">${team.name}</h3>
            
            <div class="team-info">
                <div class="team-info-item">
                    <i class="fas fa-user"></i>
                    <span>Coach: ${team.coach_name || 'Unknown'}</span>
                </div>
                <div class="team-info-item">
                    <i class="fas fa-users"></i>
                    <span>Players: ${team.players_count || 0}/${team.max_players || 25}</span>
                </div>
                ${team.stadium ? `
                    <div class="team-info-item">
                        <i class="fas fa-building"></i>
                        <span>${team.stadium}</span>
                    </div>
                ` : ''}
            </div>
        `;
        
        return card;
    },
    
    // ========== HELPERS ==========
    
    showEmpty() {
        const container = document.getElementById('teams-list');
        const emptyState = document.getElementById('teams-empty');
        
        UI.hideLoading('teams-list');
        
        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
    },
    
    // ========== MODAL CONTROLS ==========
    
    openCreateModal() {
        if (!API.isAuthenticated()) {
            UI.showNotification(CONFIG.MESSAGES.ERROR.UNAUTHORIZED, 'error');
            Auth.openAuthModal('login');
            return;
        }
        
        const user = API.getUser();
        if (user.role !== 'coach') {
            UI.showNotification('Only coaches can create teams', 'error');
            return;
        }
        
        UI.openModal('create-team-modal');
    },
    
    closeCreateModal() {
        UI.closeModal('create-team-modal');
        document.getElementById('create-team-form').reset();
    },
    
    async openDetailsModal(team) {
        this.currentTeamId = team.id;
        
        document.getElementById('modal-team-name').textContent = team.name;
        document.getElementById('modal-team-coach').textContent = team.coach_name || 'Unknown';
        document.getElementById('modal-team-stadium').textContent = team.stadium || 'Not specified';
        document.getElementById('modal-team-players').textContent = team.players_count || 0;
        
        const logo = document.getElementById('modal-team-logo');
        logo.textContent = team.logo || team.name.substring(0, 2).toUpperCase();
        logo.style.background = team.logo_color || '#2ecc71';
        
        const description = team.description || 'No description provided.';
        document.getElementById('modal-team-description').textContent = description;
        
        // Stats
        document.getElementById('modal-team-stat-matches').textContent = 0;
        document.getElementById('modal-team-stat-wins').textContent = 0;
        document.getElementById('modal-team-stat-draws').textContent = 0;
        document.getElementById('modal-team-stat-losses').textContent = 0;
        
        // Show Add Player button if user is coach of this team
        const user = API.getUser();
        const addPlayerBtn = document.getElementById('add-player-btn');
        if (user && user.role === 'coach' && team.coach_id === user.id) {
            addPlayerBtn.style.display = 'inline-flex';
        } else {
            addPlayerBtn.style.display = 'none';
        }
        
        // Load players
        await this.loadTeamPlayers(team.id);
        
        UI.openModal('team-details-modal');
    },
    
    closeDetailsModal() {
        UI.closeModal('team-details-modal');
        this.currentTeamId = null;
    },
    
    openAddPlayerModal() {
        // Reset form
        document.getElementById('search-player-email').value = '';
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('add-player-form-container').style.display = 'none';
        document.getElementById('add-player-form').reset();
        
        UI.openModal('add-player-modal');
    },
    
    closeAddPlayerModal() {
        UI.closeModal('add-player-modal');
    },
    
    // ========== ЗАГРУЗКА ИГРОКОВ КОМАНДЫ (ՆՈՐ) ==========
    
    async loadTeamPlayers(teamId) {
        const container = document.getElementById('players-container');
        
        try {
            const response = await API.getTeamById(teamId);
            const players = response.team.players || [];
            
            if (players.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-users"></i></div>
                        <h3 class="empty-title">No players yet</h3>
                        <p class="empty-subtitle">Add players to your team!</p>
                    </div>
                `;
                return;
            }
            
            // Render players list
            const user = API.getUser();
            const isCoach = user && user.role === 'coach' && response.team.coach_id === user.id;
            
            container.innerHTML = `
                <div style="display: grid; gap: 12px;">
                    ${players.map(player => `
                        <div style="
                            background: rgba(46, 204, 113, 0.1);
                            border: 1px solid rgba(46, 204, 113, 0.3);
                            border-radius: 8px;
                            padding: 16px;
                            display: flex;
                            justify-content: space-between;
                            align-items: center;
                        ">
                            <div style="display: flex; gap: 16px; align-items: center;">
                                <div style="
                                    width: 40px;
                                    height: 40px;
                                    background: var(--color-primary);
                                    border-radius: 50%;
                                    display: flex;
                                    align-items: center;
                                    justify-content: center;
                                    color: white;
                                    font-weight: bold;
                                    font-size: 16px;
                                ">
                                    ${player.jersey_number}
                                </div>
                                <div>
                                    <div style="color: white; font-weight: 600; margin-bottom: 4px;">
                                        ${player.player_name}
                                    </div>
                                    <div style="color: #b0b0b0; font-size: 14px;">
                                        <i class="fas fa-envelope" style="margin-right: 4px;"></i>
                                        ${player.player_email}
                                    </div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 12px; align-items: center;">
                                <span style="
                                    background: rgba(52, 152, 219, 0.2);
                                    color: #3498db;
                                    padding: 4px 12px;
                                    border-radius: 12px;
                                    font-size: 12px;
                                    font-weight: 600;
                                    text-transform: capitalize;
                                ">
                                    ${player.position}
                                </span>
                                ${isCoach ? `
                                    <button 
                                        class="btn btn-secondary btn-sm"
                                        onclick="Teams.handleRemovePlayer(${teamId}, ${player.player_id})"
                                        style="padding: 8px 12px;"
                                    >
                                        <i class="fas fa-times"></i>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error('❌ Failed to load players:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-exclamation-circle"></i></div>
                    <h3 class="empty-title">Failed to load players</h3>
                    <p class="empty-subtitle">${error.message}</p>
                </div>
            `;
        }
    },
    
    // ========== ПОИСК ИГРОКОВ (ՆՈՐ) ==========
    
    async searchPlayers() {
        const email = document.getElementById('search-player-email').value.trim();
        
        if (!email) {
            UI.showNotification('Please enter email to search', 'error');
            return;
        }
        
        try {
            const response = await API.searchPlayers(this.currentTeamId, email);
            const players = response.players || [];
            
            const resultsContainer = document.getElementById('search-results');
            const playersList = document.getElementById('players-search-list');
            
            if (players.length === 0) {
                playersList.innerHTML = `
                    <div style="padding: 16px; text-align: center; color: #b0b0b0;">
                        No players found with email: "${email}"
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
                            ${player.has_team ? '<div style="color: #e74c3c; font-size: 12px; margin-top: 4px;"><i class="fas fa-exclamation-circle"></i> Already in a team</div>' : ''}
                        </div>
                        <button 
                            class="btn btn-primary btn-sm"
                            onclick='Teams.selectPlayer(${JSON.stringify(player)})'
                            ${player.has_team ? 'disabled' : ''}
                        >
                            Select
                        </button>
                    </div>
                `).join('');
            }
            
            resultsContainer.style.display = 'block';
            
        } catch (error) {
            console.error('❌ Search failed:', error);
            UI.showNotification(error.message || 'Failed to search players', 'error');
        }
    },
    
    // ========== ВЫБОР ИГРОКА (ՆՈՐ) ==========
    
    selectPlayer(player) {
        document.getElementById('selected-player-id').value = player.id;
        document.getElementById('selected-player-name').textContent = player.name;
        document.getElementById('selected-player-email').textContent = player.email;
        
        document.getElementById('add-player-form-container').style.display = 'block';
        document.getElementById('player-jersey').focus();
    },
    
    // ========== ДОБАВЛЕНИЕ ИГРОКА (ՆՈՐ) ==========
    
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
            
            console.log('➕ Adding player to team...', playerData);
            
            await API.addPlayerToTeam(this.currentTeamId, playerData);
            
            UI.showNotification('Player added successfully!', 'success');
            
            this.closeAddPlayerModal();
            
            // Reload players list
            await this.loadTeamPlayers(this.currentTeamId);
            
            // Reload teams to update count
            await this.load();
            
        } catch (error) {
            console.error('❌ Failed to add player:', error);
            UI.showNotification(error.message || 'Failed to add player', 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },
    
    // ========== УДАЛЕНИЕ ИГРОКА (ՆՈՐ) ==========
    
    async handleRemovePlayer(teamId, playerId) {
        if (!confirm('Are you sure you want to remove this player from the team?')) {
            return;
        }
        
        try {
            console.log('➖ Removing player from team...', playerId);
            
            await API.removePlayerFromTeam(teamId, playerId);
            
            UI.showNotification('Player removed successfully!', 'success');
            
            // Reload players list
            await this.loadTeamPlayers(teamId);
            
            // Reload teams to update count
            await this.load();
            
        } catch (error) {
            console.error('❌ Failed to remove player:', error);
            UI.showNotification(error.message || 'Failed to remove player', 'error');
        }
    },
    
    // ========== СОЗДАНИЕ КОМАНДЫ ==========
    
    async handleCreate(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        
        UI.showButtonLoading(submitBtn);
        
        try {
            const teamData = {
                name: document.getElementById('team-name').value.trim(),
                logo: document.getElementById('team-logo').value.trim().toUpperCase(),
                logoColor: document.getElementById('team-color').value,
                stadium: document.getElementById('team-stadium').value.trim(),
                description: document.getElementById('team-description').value.trim(),
                maxPlayers: parseInt(document.getElementById('team-max-players').value),
            };
            
            console.log('📝 Creating team...', teamData.name);
            
            await API.createTeam(teamData);
            
            UI.showNotification(CONFIG.MESSAGES.SUCCESS.TEAM_CREATED, 'success');
            
            this.closeCreateModal();
            
            // Перезагружаем команды
            await this.load();
            
        } catch (error) {
            console.error('❌ Failed to create team:', error);
            UI.showNotification(error.message || CONFIG.MESSAGES.ERROR.CREATE_TEAM, 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },
    
};

// Экспортируем
window.Teams = Teams;

console.log('✅ Teams Module loaded');