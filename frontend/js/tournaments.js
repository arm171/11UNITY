/* ==============================================
   TOURNAMENTS MODULE - Լոգիկա տուրնիրով
   ============================================== */

const Tournaments = {
    
    tournaments: [],
    currentTournament: null, // ՆՈՐ - fixtures generation-ի համար
    
    // ========== ԻՆԻՑԻԱԼԻԶԱՑԻԱ ==========
    
    init() {
        this.createModals();
        this.attachEventListeners();
        this.load();
        console.log('✅ Tournaments Module initialized');
    },
    
    // ========== ՍՏԵՂԾԱՆԻԵ ՄՈԴԱԼԿՆՅԽ ՈԿՈՆ ==========
    
    createModals() {
        const modalsHTML = `
            <!-- Create Tournament Modal -->
            <div class="modal" id="create-tournament-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-create-tournament">&times;</button>
                    
                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-trophy"></i> Create Tournament
                    </h2>
                    
                    <form id="create-tournament-form">
                        <div class="form-group">
                            <label class="form-label">Tournament Name</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="tournament-name" 
                                placeholder="Champions League 2024"
                                required
                            >
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Type</label>
                            <select class="form-select" id="tournament-type" required>
                                <option value="">Select type</option>
                                <option value="league">League (All vs All)</option>
                                <option value="playoff">Playoff (Knockout)</option>
                                <option value="group_playoff">Group + Playoff</option>
                            </select>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label">Start Date</label>
                                <input 
                                    type="date" 
                                    class="form-input" 
                                    id="tournament-start-date" 
                                    required
                                >
                            </div>
                            
                            <div class="form-group">
                                <label class="form-label">End Date</label>
                                <input 
                                    type="date" 
                                    class="form-input" 
                                    id="tournament-end-date" 
                                    required
                                >
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Location</label>
                            <input 
                                type="text" 
                                class="form-input" 
                                id="tournament-location" 
                                placeholder="City, Stadium"
                                required
                            >
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Maximum Teams</label>
                            <select class="form-select" id="tournament-max-teams" required>
                                <option value="4">4 teams</option>
                                <option value="8" selected>8 teams</option>
                                <option value="12">12 teams</option>
                                <option value="16">16 teams</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Description</label>
                            <textarea 
                                class="form-textarea" 
                                id="tournament-description" 
                                placeholder="Tournament details..."
                                rows="4"
                            ></textarea>
                        </div>
                        
                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Tournaments.closeCreateModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text">Create Tournament</span>
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

                    <!-- Միանալ կոճակ (միայն մարզիչների համար) -->
                    <div style="text-align: center; margin-bottom: 32px;">
                        <button class="btn btn-primary" id="join-tournament-btn" style="display: none;">
                            <i class="fas fa-plus-circle"></i> Միանալ Մրցաշարին
                        </button>
                        <p id="join-tournament-status" style="margin-top: 16px; display: none; font-size: 16px; font-weight: 600;">
                            <i class="fas fa-check-circle"></i> <span id="join-status-text"></span>
                        </p>
                    </div>

                    <!-- Generate Fixtures կոճակ (organizer-ի համար) -->
                    <div style="text-align: center; margin-bottom: 32px;">
                        <button class="btn btn-primary" id="generate-fixtures-btn" style="display: none;">
                            <i class="fas fa-magic"></i> Generate Fixtures
                        </button>
                    </div>
                    
                    <div class="empty-state">
                        <div class="empty-icon"><i class="fas fa-trophy"></i></div>
                        <h3 class="empty-title">Tournament Details</h3>
                        <p class="empty-subtitle">More details coming soon!</p>
                    </div>
                </div>
            </div>

            <!-- Fixtures Settings Modal - ՆՈՐ MODAL -->
            <div class="modal" id="fixtures-settings-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-fixtures-settings">&times;</button>
                    
                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-magic"></i> Generate Fixtures Settings
                    </h2>
                    
                    <form id="fixtures-settings-form">
                        <div class="form-group">
                            <label class="form-label">Start Date</label>
                            <input type="date" class="form-input" id="fixtures-start-date" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Match Time</label>
                            <input type="time" class="form-input" id="fixtures-match-time" value="18:00" required>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Match Days</label>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="1"> Mon
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="2"> Tue
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="3" checked> Wed
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="4"> Thu
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="5" checked> Fri
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="6"> Sat
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="0"> Sun
                                </label>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Matches Per Day</label>
                            <select class="form-select" id="fixtures-matches-per-day" required>
                                <option value="1">1 match</option>
                                <option value="2" selected>2 matches</option>
                                <option value="3">3 matches</option>
                                <option value="4">4 matches</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Venue</label>
                            <input type="text" class="form-input" id="fixtures-venue" placeholder="Stadium name">
                        </div>
                        
                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Tournaments.closeFixturesSettingsModal()">
                                Cancel
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text">Generate</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalsHTML);
    },
    
    // ========== EVENT LISTENERS ==========
    
    attachEventListeners() {
        // Create Tournament button
        const createBtn = document.getElementById('create-tournament-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateModal());
        }
        
        // Close modals
        document.getElementById('close-create-tournament')?.addEventListener('click', () => this.closeCreateModal());
        document.getElementById('close-tournament-details')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('close-fixtures-settings')?.addEventListener('click', () => this.closeFixturesSettingsModal());
        
        // Close on overlay
        document.querySelector('#create-tournament-modal .modal-overlay')?.addEventListener('click', () => this.closeCreateModal());
        document.querySelector('#tournament-details-modal .modal-overlay')?.addEventListener('click', () => this.closeDetailsModal());
        document.querySelector('#fixtures-settings-modal .modal-overlay')?.addEventListener('click', () => this.closeFixturesSettingsModal());
        
        // Form submit
        document.getElementById('create-tournament-form')?.addEventListener('submit', (e) => this.handleCreate(e));
        document.getElementById('fixtures-settings-form')?.addEventListener('submit', (e) => this.handleGenerateFixtures(e));
    },
    
    // ========== ЗАГРУЗКА ТУРНИРОВ ==========
    
    async load() {
        try {
            console.log('🔥 Loading tournaments...');
            
            UI.showLoading('tournaments-list');
            
            const response = await API.getTournaments();
            
            this.tournaments = response.tournaments || [];
            
            this.updateStats();
            this.render();
            
        } catch (error) {
            console.error('❌ Failed to load tournaments:', error);
            UI.showNotification(CONFIG.MESSAGES.ERROR.LOAD_TOURNAMENTS, 'error');
            this.showEmpty();
        }
    },
    
    // ========== ОБНОВЛЕНИЕ СТАТИСТИКИ ==========
    
    updateStats() {
        const total = this.tournaments.length;
        const active = this.tournaments.filter(t => t.status === 'active').length;
        const finished = this.tournaments.filter(t => t.status === 'finished').length;
        
        document.getElementById('total-tournaments').textContent = total;
        document.getElementById('active-tournaments').textContent = active;
        document.getElementById('finished-tournaments').textContent = finished;
    },
    
    // ========== ОТОБРАЖЕНИЕ ТУРНИРОВ ==========
    
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
    
    // ========== СОЗДАНИЕ КАРТОЧКИ ==========
    
    createCard(tournament) {
        const card = document.createElement('div');
        card.className = 'card tournament-card';
        card.onclick = () => this.openDetailsModal(tournament);
        
        const startDate = UI.formatDate(tournament.start_date);
        const endDate = UI.formatDate(tournament.end_date);
        
        const statusClass = `badge-${tournament.status}`;
        const statusText = {
            'upcoming': 'Upcoming',
            'active': 'Active',
            'finished': 'Finished'
        }[tournament.status] || tournament.status;
        
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
                    <span>${tournament.location || 'TBD'}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${tournament.teams_count || 0}/${tournament.max_teams} teams</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-list"></i>
                    <span>${this.getTypeLabel(tournament.type)}</span>
                </div>
            </div>
            
            <div class="tournament-description">
                ${tournament.description || 'No description available.'}
            </div>
            
            <div class="tournament-footer">
                <i class="fas fa-user"></i>
                <span>${tournament.organizer_name || 'Unknown'}</span>
            </div>
        `;
        
        return card;
    },
    
    // ========== HELPERS ==========
    
    getTypeLabel(type) {
        const labels = {
            'league': 'League',
            'playoff': 'Playoff',
            'group_playoff': 'Group + Playoff'
        };
        return labels[type] || type;
    },
    
    showEmpty() {
        const container = document.getElementById('tournaments-list');
        const emptyState = document.getElementById('tournaments-empty');
        
        UI.hideLoading('tournaments-list');
        
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
        if (user.role !== 'organizer') {
            UI.showNotification('Only organizers can create tournaments', 'error');
            return;
        }
        
        UI.openModal('create-tournament-modal');
    },
    
    closeCreateModal() {
        UI.closeModal('create-tournament-modal');
        document.getElementById('create-tournament-form').reset();
    },
    
    async openDetailsModal(tournament) {
        document.getElementById('modal-tournament-name').textContent = tournament.name;
        
        const statusBadge = document.getElementById('modal-tournament-status');
        statusBadge.className = `badge badge-${tournament.status}`;
        statusBadge.textContent = {
            'upcoming': 'Upcoming',
            'active': 'Active',
            'finished': 'Finished'
        }[tournament.status] || tournament.status;
        
        const startDate = UI.formatDate(tournament.start_date);
        const endDate = UI.formatDate(tournament.end_date);
        document.getElementById('modal-tournament-dates').textContent = `${startDate} - ${endDate}`;
        
        document.getElementById('modal-tournament-location').textContent = tournament.location || 'TBD';
        document.getElementById('modal-tournament-teams').textContent = `${tournament.teams_count || 0}/${tournament.max_teams} teams`;
        document.getElementById('modal-tournament-type').textContent = this.getTypeLabel(tournament.type);
        document.getElementById('modal-tournament-description').textContent = tournament.description || 'No description available.';
        
        // Միանալ կոճակի տրամաբանություն (async)
        await this.updateJoinButton(tournament);
        
        // Generate Fixtures կոճակի տրամաբանություն (async)
        await this.updateGenerateFixturesButton(tournament);
        
        UI.openModal('tournament-details-modal');
    },
    
    closeDetailsModal() {
        UI.closeModal('tournament-details-modal');
    },
    
    closeFixturesSettingsModal() {
        UI.closeModal('fixtures-settings-modal');
        document.getElementById('fixtures-settings-form').reset();
    },
    
    // ========== ՄԻԱՆԱԼ ԿՈՃԱԿԻ ԹԱՐՄԱՑՈՒՄ ==========
    
    async updateJoinButton(tournament) {
        const joinBtn = document.getElementById('join-tournament-btn');
        const joinStatus = document.getElementById('join-tournament-status');
        const joinStatusText = document.getElementById('join-status-text');
        
        // Թաքցնել երկուսն էլ սկզբում
        joinBtn.style.display = 'none';
        joinStatus.style.display = 'none';
        
        // Ստուգել մուտք գործած է
        if (!API.isAuthenticated()) {
            return;
        }
        
        const user = API.getUser();
        
        // Միայն մարզիչները կարող են միանալ
        if (user.role !== 'coach') {
            return;
        }
        
        try {
            // Ստուգել սերվերից արդեն միացել է
            const response = await API.checkTournamentJoined(tournament.id);
            
            if (response.joined) {
                // Արդեն միացել է
                joinStatusText.textContent = 'Ձեր թիմը մասնակցում է այս մրցաշարին';
                joinStatus.style.color = '#2ecc71';
                joinStatus.style.display = 'block';
                return;
            }
            
            if (!response.hasTeam) {
                // Թիմ չունի
                joinStatusText.textContent = 'Նախ պետք է ստեղծեք թիմ';
                joinStatus.style.color = '#f39c12';
                joinStatus.querySelector('i').className = 'fas fa-exclamation-triangle';
                joinStatus.style.display = 'block';
                return;
            }
            
        } catch (error) {
            console.error('Ստուգման սխալ:', error);
            // Եթե սխալ է, թույլ տանք փորձել միանալ
        }
        
        // Ստուգել լիքը չէ
        const currentTeams = tournament.teams_count || 0;
        const maxTeams = tournament.max_teams;
        
        if (currentTeams < maxTeams) {
            joinBtn.style.display = 'inline-flex';
            joinBtn.onclick = () => this.handleJoinTournament(tournament.id);
        } else {
            joinStatusText.textContent = 'Մրցաշարը լիքն է';
            joinStatus.style.color = '#e74c3c';
            joinStatus.querySelector('i').className = 'fas fa-times-circle';
            joinStatus.style.display = 'block';
        }
    },
    
    // ========== GENERATE FIXTURES ԿՈՃԱԿԻ ԹԱՐՄԱՑՈՒՄ ==========
    
    async updateGenerateFixturesButton(tournament) {
        const generateBtn = document.getElementById('generate-fixtures-btn');
        
        if (!generateBtn) return;
        
        // Թաքցնել սկզբում
        generateBtn.style.display = 'none';
        
        // Ստուգել մուտք գործած է
        if (!API.isAuthenticated()) return;
        
        const user = API.getUser();
        
        // Միայն organizer-ները կարող են generate անել
        if (user.role !== 'organizer') return;
        
        // Միայն իր սեփական մրցաշարների համար
        if (tournament.organizer_id !== user.id) return;
        
        // Ցույց տալ կոճակը
        generateBtn.style.display = 'inline-flex';
        generateBtn.onclick = () => this.openGenerateFixturesModal(tournament);
    },
    
    // ========== ՄԻԱՆԱԼ ՄՐՑԱՇԱՐԻՆ ==========
    
    async handleJoinTournament(tournamentId) {
        const joinBtn = document.getElementById('join-tournament-btn');
        
        // Անջատել կոճակը
        joinBtn.disabled = true;
        const originalHTML = joinBtn.innerHTML;
        joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Միանում է...';
        
        try {
            console.log('🔵 Միանում է մրցաշարին:', tournamentId);
            
            await API.joinTournament(tournamentId);
            
            UI.showNotification('Հաջողությամբ միացաք մրցաշարին!', 'success');
            
            // Դակել մոդալը
            this.closeDetailsModal();
            
            // Թարմացնել մրցաշարների ցուցակը
            await this.load();
            
        } catch (error) {
            console.error('❌ Միանալու սխալ:', error);
            UI.showNotification(error.message || 'Չհաջողվեց միանալ մրցաշարին', 'error');
            
            // Վերականգնել կոճակը
            joinBtn.innerHTML = originalHTML;
            joinBtn.disabled = false;
        }
    },
    
    // ========== FIXTURES GENERATION MODAL ==========
    
    openGenerateFixturesModal(tournament) {
        this.currentTournament = tournament;
        this.closeDetailsModal();
        UI.openModal('fixtures-settings-modal');
    },
    
    // ========== HANDLE GENERATE FIXTURES ==========
    
    async handleGenerateFixtures(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);
        
        try {
            const matchDays = Array.from(document.querySelectorAll('input[name="match-days"]:checked'))
                .map(cb => parseInt(cb.value));
            
            if (matchDays.length === 0) {
                throw new Error('Select at least one match day');
            }
            
            const data = {
                startDate: document.getElementById('fixtures-start-date').value,
                matchTime: document.getElementById('fixtures-match-time').value,
                matchDays: matchDays,
                matchesPerDay: parseInt(document.getElementById('fixtures-matches-per-day').value),
                daysBetweenRounds: 0,
                venue: document.getElementById('fixtures-venue').value || 'TBD'
            };
            
            console.log('🎲 Generating fixtures with settings:', data);
            
            const response = await API.request(`/tournaments/${this.currentTournament.id}/fixtures/generate`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            
            UI.showNotification('Fixtures generated successfully!', 'success');
            this.closeFixturesSettingsModal();
            await this.load();
            
        } catch (error) {
            console.error('❌ Generate fixtures error:', error);
            UI.showNotification(error.message || 'Failed to generate fixtures', 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },
    
    // ========== СОЗДАНИЕ ТУРНИРА ==========
    
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
            
            console.log('🏆 Creating tournament...', tournamentData.name);
            
            await API.createTournament(tournamentData);
            
            UI.showNotification(CONFIG.MESSAGES.SUCCESS.TOURNAMENT_CREATED, 'success');
            
            this.closeCreateModal();
            
            // Перезагружаем турниры
            await this.load();
            
        } catch (error) {
            console.error('❌ Failed to create tournament:', error);
            UI.showNotification(error.message || CONFIG.MESSAGES.ERROR.CREATE_TOURNAMENT, 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },
    
};

// Экспортируем
window.Tournaments = Tournaments;

console.log('✅ Tournaments Module loaded');