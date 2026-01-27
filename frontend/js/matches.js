// ============================================
// MATCHES MODULE
// Matches display and filtering
// ============================================

const Matches = {

    matches: [],
    tournaments: [],
    currentFilter: 'all',

    init() {
        this.attachEventListeners();
        this.load();

        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            if (window.I18n) {
                I18n.applyTranslations();
            }
            this.render();
        });
    },

    attachEventListeners() {
        // Filter change event
        const filterSelect = document.getElementById('matches-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.render();
            });
        }
    },

    async load() {
        const container = document.getElementById('matches-list');
        if (!container) return;

        UI.showLoading('matches-list');

        try {
            // Load matches and tournaments in parallel
            const [matchesResponse, tournamentsResponse] = await Promise.all([
                API.getMatches(),
                API.getTournaments()
            ]);

            this.matches = matchesResponse.matches || [];
            this.tournaments = tournamentsResponse.tournaments || [];

            this.updateFilterOptions();
            this.updateStats();
            this.render();

        } catch (error) {
            console.error('Failed to load matches:', error);
            UI.showNotification(I18n.t('messages.error.loadMatches') || 'Failed to load matches', 'error');
            this.showEmpty();
        }
    },

    updateFilterOptions() {
        const filterSelect = document.getElementById('matches-filter');
        if (!filterSelect) return;

        // Keep "All tournaments" option, remove others
        filterSelect.innerHTML = `<option value="all" data-i18n="matches.allTournaments">${I18n.t('matches.allTournaments')}</option>`;

        // Add tournament options
        this.tournaments.forEach(tournament => {
            const option = document.createElement('option');
            option.value = tournament.id;
            option.textContent = tournament.name;
            filterSelect.appendChild(option);
        });

        // Restore selected filter
        filterSelect.value = this.currentFilter;
    },

    updateStats() {
        const total = this.matches.length;
        const finished = this.matches.filter(m => m.status === 'finished').length;
        const scheduled = this.matches.filter(m => m.status === 'scheduled').length;

        const totalEl = document.getElementById('total-matches');
        const finishedEl = document.getElementById('finished-matches');
        const scheduledEl = document.getElementById('scheduled-matches');

        if (totalEl) totalEl.textContent = total;
        if (finishedEl) finishedEl.textContent = finished;
        if (scheduledEl) scheduledEl.textContent = scheduled;
    },

    render() {
        const container = document.getElementById('matches-list');
        const emptyState = document.getElementById('matches-empty');

        if (!container) return;

        UI.hideLoading('matches-list');

        // Filter matches
        let filteredMatches = this.matches;
        if (this.currentFilter !== 'all') {
            filteredMatches = this.matches.filter(m => m.tournament_id == this.currentFilter);
        }

        if (filteredMatches.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        // Group matches by date
        const matchesByDate = this.groupMatchesByDate(filteredMatches);

        container.innerHTML = '';

        Object.entries(matchesByDate).forEach(([date, matches]) => {
            const dateSection = this.createDateSection(date, matches);
            container.appendChild(dateSection);
        });
    },

    groupMatchesByDate(matches) {
        const groups = {};

        matches.forEach(match => {
            const date = new Date(match.match_date).toLocaleDateString(
                I18n.getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US',
                { year: 'numeric', month: 'long', day: 'numeric' }
            );

            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(match);
        });

        return groups;
    },

    createDateSection(date, matches) {
        const section = document.createElement('div');
        section.className = 'matches-date-section';

        section.innerHTML = `
            <h3 class="matches-date-header">
                <i class="fas fa-calendar-day"></i> ${date}
            </h3>
            <div class="matches-list-items">
                ${matches.map(match => this.createMatchCard(match)).join('')}
            </div>
        `;

        return section;
    },

    createMatchCard(match) {
        const isFinished = match.status === 'finished';
        const matchTime = new Date(match.match_date).toLocaleTimeString(
            I18n.getCurrentLanguage() === 'ru' ? 'ru-RU' : 'en-US',
            { hour: '2-digit', minute: '2-digit' }
        );

        const homeScore = match.home_score ?? '-';
        const awayScore = match.away_score ?? '-';

        return `
            <div class="match-card ${isFinished ? 'finished' : 'scheduled'}">
                <div class="match-tournament-badge">
                    <i class="fas fa-trophy"></i> ${match.tournament_name}
                </div>

                <div class="match-content">
                    <div class="match-team home">
                        <div class="team-logo-small" style="background: ${match.home_team_color || '#2ecc71'}">
                            ${match.home_team_logo || match.home_team_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span class="team-name">${match.home_team_name}</span>
                    </div>

                    <div class="match-score-section">
                        ${isFinished ? `
                            <div class="match-score">
                                <span class="score">${homeScore}</span>
                                <span class="score-separator">:</span>
                                <span class="score">${awayScore}</span>
                            </div>
                            <div class="match-status finished">${I18n.t('matches.finished')}</div>
                        ` : `
                            <div class="match-time">${matchTime}</div>
                            <div class="match-status scheduled">${I18n.t('matches.scheduled')}</div>
                        `}
                    </div>

                    <div class="match-team away">
                        <span class="team-name">${match.away_team_name}</span>
                        <div class="team-logo-small" style="background: ${match.away_team_color || '#3498db'}">
                            ${match.away_team_logo || match.away_team_name.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                </div>

                <div class="match-footer">
                    <span class="match-round">${I18n.t('tournaments.round', { num: match.round })}</span>
                    <span class="match-venue"><i class="fas fa-map-marker-alt"></i> ${match.venue || I18n.t('common.tbd')}</span>
                </div>
            </div>
        `;
    },

    showEmpty() {
        const container = document.getElementById('matches-list');
        const emptyState = document.getElementById('matches-empty');

        UI.hideLoading('matches-list');

        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
    }
};

window.Matches = Matches;
