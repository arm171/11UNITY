// ============================================
// STATISTICS MODULE
// Global & tournament-specific statistics
// ============================================

const Statistics = {

    data: null,
    tournamentData: null,
    currentMode: 'global', // 'global' or tournament id

    init() {
        this.attachEventListeners();
        this.loadTournamentsList();
        this.load();

        window.addEventListener('languageChanged', () => {
            this.render();
        });
    },

    attachEventListeners() {
        const select = document.getElementById('statistics-tournament-select');
        if (select) {
            select.addEventListener('change', (e) => {
                this.currentMode = e.target.value;
                if (this.currentMode === 'global') {
                    this.load();
                } else {
                    this.loadTournamentStats(this.currentMode);
                }
            });
        }
    },

    async loadTournamentsList() {
        try {
            const response = await API.request('/statistics/tournaments');
            const tournaments = response.tournaments || [];

            const select = document.getElementById('statistics-tournament-select');
            if (!select) return;

            const t = (key) => window.I18n ? I18n.t(key) : key;

            // Keep global option
            select.innerHTML = `<option value="global">${t('statistics.global')}</option>`;

            tournaments.forEach(tournament => {
                const option = document.createElement('option');
                option.value = tournament.id;
                const statusIcon = tournament.status === 'active' ? '🟢' : tournament.status === 'upcoming' ? '🟡' : '⚪';
                option.textContent = `${statusIcon} ${tournament.name}`;
                select.appendChild(option);
            });

        } catch (error) {
            console.error('Failed to load tournaments list:', error);
        }
    },

    async load() {
        const container = document.getElementById('statistics-content');
        if (!container) return;

        UI.showLoading('statistics-content');

        try {
            const response = await API.getStatistics();
            this.data = response.statistics;
            this.currentMode = 'global';
            this.render();

        } catch (error) {
            console.error('Failed to load statistics:', error);
            this.showError();
        }
    },

    async loadTournamentStats(tournamentId) {
        const container = document.getElementById('statistics-content');
        if (!container) return;

        UI.showLoading('statistics-content');

        try {
            const response = await API.request(`/statistics/tournament/${tournamentId}`);
            this.tournamentData = response;
            this.render();

        } catch (error) {
            console.error('Failed to load tournament statistics:', error);
            this.showError();
        }
    },

    render() {
        if (this.currentMode === 'global') {
            this.renderGlobal();
        } else {
            this.renderTournament();
        }
    },

    renderGlobal() {
        const container = document.getElementById('statistics-content');
        if (!container || !this.data) return;

        UI.hideLoading('statistics-content');

        const t = (key) => window.I18n ? I18n.t(key) : key;
        const fn = (num) => window.I18n && I18n.formatNumber ? I18n.formatNumber(num) : num;

        container.innerHTML = `
            <!-- Main Stats Grid -->
            <div class="stats-grid stats-grid-5">
                <div class="stat-card">
                    <span class="stat-number">${fn(this.data.tournaments)}</span>
                    <span class="stat-label">${t('statistics.tournaments')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${fn(this.data.teams)}</span>
                    <span class="stat-label">${t('statistics.teams')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${fn(this.data.matches)}</span>
                    <span class="stat-label">${t('statistics.matches')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${fn(this.data.players)}</span>
                    <span class="stat-label">${t('statistics.players')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${fn(this.data.goals)}</span>
                    <span class="stat-label">${t('statistics.goals')}</span>
                </div>
            </div>

            <!-- Top Lists -->
            <div class="statistics-lists">
                <!-- Top Scorers -->
                <div class="statistics-list-card">
                    <h3><i class="fas fa-futbol"></i> ${t('statistics.topScorers')}</h3>
                    ${this.renderTopList(this.data.topScorers, 'goals', 'fas fa-futbol')}
                </div>

                <!-- Top Assists -->
                <div class="statistics-list-card">
                    <h3><i class="fas fa-hands-helping"></i> ${t('statistics.topAssists')}</h3>
                    ${this.renderTopList(this.data.topAssists, 'assists', 'fas fa-hands-helping')}
                </div>
            </div>
        `;
    },

    renderTournament() {
        const container = document.getElementById('statistics-content');
        if (!container || !this.tournamentData) return;

        UI.hideLoading('statistics-content');

        const t = (key) => window.I18n ? I18n.t(key) : key;
        const { tournament, standings, topScorers, topAssists } = this.tournamentData;

        container.innerHTML = `
            <!-- Standings Table -->
            <div class="standings-section">
                <h3 style="color: white; margin-bottom: 16px;">
                    <i class="fas fa-table"></i> ${t('statistics.standings')}
                </h3>
                ${this.renderStandingsTable(standings)}
            </div>

            <!-- Top Lists -->
            <div class="statistics-lists" style="margin-top: 32px;">
                <div class="statistics-list-card">
                    <h3><i class="fas fa-futbol"></i> ${t('statistics.topScorers')}</h3>
                    ${this.renderTopList(topScorers, 'goals', 'fas fa-futbol')}
                </div>
                <div class="statistics-list-card">
                    <h3><i class="fas fa-hands-helping"></i> ${t('statistics.topAssists')}</h3>
                    ${this.renderTopList(topAssists, 'assists', 'fas fa-hands-helping')}
                </div>
            </div>
        `;
    },

    renderStandingsTable(standings) {
        if (!standings || standings.length === 0) {
            const t = (key) => window.I18n ? I18n.t(key) : key;
            return `<p class="statistics-empty">${t('statistics.noData')}</p>`;
        }

        const t = (key) => window.I18n ? I18n.t(key) : key;

        return `
            <div class="standings-table-container">
                <table class="standings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th class="team-col">${t('stats.team')}</th>
                            <th>${t('stats.played')}</th>
                            <th>${t('stats.won')}</th>
                            <th>${t('stats.drawn')}</th>
                            <th>${t('stats.lost')}</th>
                            <th>${t('stats.goalsFor')}</th>
                            <th>${t('stats.goalsAgainst')}</th>
                            <th>${t('stats.goalDifference')}</th>
                            <th class="points-col">${t('stats.points')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${standings.map((row, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td class="team-col">
                                    <div style="display: flex; align-items: center; gap: 8px;">
                                        <div class="team-logo-tiny" style="background: ${row.team_color || '#2ecc71'}">
                                            ${UI.escapeHtml(row.team_logo || row.team_name.replace(/\s+/g, '').substring(0, 3).toUpperCase())}
                                        </div>
                                        ${UI.escapeHtml(row.team_name)}
                                    </div>
                                </td>
                                <td>${row.played}</td>
                                <td>${row.won}</td>
                                <td>${row.drawn}</td>
                                <td>${row.lost}</td>
                                <td>${row.goals_for}</td>
                                <td>${row.goals_against}</td>
                                <td>${row.goal_difference > 0 ? '+' : ''}${row.goal_difference}</td>
                                <td class="points-col"><strong>${row.points}</strong></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    },

    renderTopList(list, valueKey, iconClass) {
        const t = (key) => window.I18n ? I18n.t(key) : key;

        if (!list || list.length === 0) {
            return `<p class="statistics-empty">${t('statistics.noData')}</p>`;
        }

        return `
            <ul class="statistics-ranking">
                ${list.map((item, index) => `
                    <li class="ranking-item">
                        <span class="ranking-position">${index + 1}</span>
                        <div class="ranking-info">
                            <span class="ranking-name">${UI.escapeHtml(item.name)}</span>
                            <span class="ranking-team">${UI.escapeHtml(item.team_name || '')}</span>
                        </div>
                        <span class="ranking-value">${item[valueKey]} <i class="${iconClass}"></i></span>
                    </li>
                `).join('')}
            </ul>
        `;
    },

    showError() {
        const container = document.getElementById('statistics-content');
        if (!container) return;

        UI.hideLoading('statistics-content');

        const t = (key) => window.I18n ? I18n.t(key) : key;

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h3 class="empty-title">${t('statistics.error')}</h3>
                <p class="empty-subtitle">${t('statistics.errorSubtitle')}</p>
            </div>
        `;
    }
};

window.Statistics = Statistics;
