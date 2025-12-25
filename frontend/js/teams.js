/* ==============================================
   TEAMS MODULE - Логика команд
   ============================================== */

const Teams = {
    
    teams: [],
    
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
                    
                    <!-- Players Section -->
                    <h3 style="color: white; margin-bottom: 16px;">
                        <i class="fas fa-users"></i> Team Players
                    </h3>
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-users"></i></div>
                        <h3 class="empty-title">No players yet</h3>
                        <p class="empty-subtitle">Players will be added soon!</p>
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
        
        // Close on overlay
        document.querySelector('#create-team-modal .modal-overlay')?.addEventListener('click', () => this.closeCreateModal());
        document.querySelector('#team-details-modal .modal-overlay')?.addEventListener('click', () => this.closeDetailsModal());
        
        // Form submit
        document.getElementById('create-team-form')?.addEventListener('submit', (e) => this.handleCreate(e));
        
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
        const totalCoaches = this.teams.length; // Каждая команда имеет тренера
        
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
            Auth.openLoginModal();
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
    
    openDetailsModal(team) {
        document.getElementById('modal-team-name').textContent = team.name;
        document.getElementById('modal-team-coach').textContent = team.coach_name || 'Unknown';
        document.getElementById('modal-team-stadium').textContent = team.stadium || 'Not specified';
        document.getElementById('modal-team-players').textContent = team.players_count || 0;
        
        const logo = document.getElementById('modal-team-logo');
        logo.textContent = team.logo || team.name.substring(0, 2).toUpperCase();
        logo.style.background = team.logo_color || '#2ecc71';
        
        const description = team.description || 'No description provided.';
        document.getElementById('modal-team-description').textContent = description;
        
        // Stats (пока 0, будем добавлять позже)
        document.getElementById('modal-team-stat-matches').textContent = 0;
        document.getElementById('modal-team-stat-wins').textContent = 0;
        document.getElementById('modal-team-stat-draws').textContent = 0;
        document.getElementById('modal-team-stat-losses').textContent = 0;
        
        UI.openModal('team-details-modal');
    },
    
    closeDetailsModal() {
        UI.closeModal('team-details-modal');
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