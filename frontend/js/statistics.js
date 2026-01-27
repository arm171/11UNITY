// ============================================
// STATISTICS MODULE
// Global site statistics display
// ============================================

const Statistics = {

    data: null,

    init() {
        this.load();

        // Listen for language changes
        window.addEventListener('languageChanged', () => {
            this.render();
        });
    },

    async load() {
        const container = document.getElementById('statistics-content');
        if (!container) return;

        UI.showLoading('statistics-content');

        try {
            const response = await API.getStatistics();
            this.data = response.statistics;
            this.render();

        } catch (error) {
            console.error('Failed to load statistics:', error);
            this.showError();
        }
    },

    render() {
        const container = document.getElementById('statistics-content');
        if (!container || !this.data) return;

        UI.hideLoading('statistics-content');

        container.innerHTML = `
            <!-- Main Stats Grid -->
            <div class="stats-grid stats-grid-5">
                <div class="stat-card">
                    <span class="stat-number">${I18n.formatNumber(this.data.tournaments)}</span>
                    <span class="stat-label" data-i18n="statistics.tournaments">${I18n.t('statistics.tournaments')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${I18n.formatNumber(this.data.teams)}</span>
                    <span class="stat-label" data-i18n="statistics.teams">${I18n.t('statistics.teams')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${I18n.formatNumber(this.data.matches)}</span>
                    <span class="stat-label" data-i18n="statistics.matches">${I18n.t('statistics.matches')}</span>
                </div>
                <div class="stat-card">
                    <span class="stat-number">${I18n.formatNumber(this.data.players)}</span>
                    <span class="stat-label" data-i18n="statistics.players">${I18n.t('statistics.players')}</span>
                </div>
                <div class="stat-card stat-card-highlight">
                    <span class="stat-number">${I18n.formatNumber(this.data.goals)}</span>
                    <span class="stat-label" data-i18n="statistics.goals">${I18n.t('statistics.goals')}</span>
                </div>
            </div>

            <!-- Top Lists -->
            <div class="statistics-lists">
                <!-- Top Scorers -->
                <div class="statistics-list-card">
                    <h3><i class="fas fa-futbol"></i> <span data-i18n="statistics.topScorers">${I18n.t('statistics.topScorers')}</span></h3>
                    ${this.renderTopScorers()}
                </div>

                <!-- Top Teams -->
                <div class="statistics-list-card">
                    <h3><i class="fas fa-trophy"></i> <span data-i18n="statistics.topTeams">${I18n.t('statistics.topTeams')}</span></h3>
                    ${this.renderTopTeams()}
                </div>
            </div>
        `;
    },

    renderTopScorers() {
        if (!this.data.topScorers || this.data.topScorers.length === 0) {
            return `<p class="statistics-empty">${I18n.t('statistics.noData')}</p>`;
        }

        return `
            <ul class="statistics-ranking">
                ${this.data.topScorers.map((player, index) => `
                    <li class="ranking-item">
                        <span class="ranking-position">${index + 1}</span>
                        <div class="ranking-info">
                            <span class="ranking-name">${player.name}</span>
                            <span class="ranking-team">${player.team_name || I18n.t('statistics.noTeam')}</span>
                        </div>
                        <span class="ranking-value">${player.goals} <i class="fas fa-futbol"></i></span>
                    </li>
                `).join('')}
            </ul>
        `;
    },

    renderTopTeams() {
        if (!this.data.topTeams || this.data.topTeams.length === 0) {
            return `<p class="statistics-empty">${I18n.t('statistics.noData')}</p>`;
        }

        return `
            <ul class="statistics-ranking">
                ${this.data.topTeams.map((team, index) => `
                    <li class="ranking-item">
                        <span class="ranking-position">${index + 1}</span>
                        <div class="ranking-logo" style="background: ${team.logo_color || '#2ecc71'}">
                            ${team.logo || team.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div class="ranking-info">
                            <span class="ranking-name">${team.name}</span>
                            <span class="ranking-team">${team.played} ${I18n.t('statistics.gamesPlayed')}</span>
                        </div>
                        <span class="ranking-value">${team.wins} <i class="fas fa-trophy"></i></span>
                    </li>
                `).join('')}
            </ul>
        `;
    },

    showError() {
        const container = document.getElementById('statistics-content');
        if (!container) return;

        UI.hideLoading('statistics-content');

        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
                <h3 class="empty-title" data-i18n="statistics.error">${I18n.t('statistics.error')}</h3>
                <p class="empty-subtitle" data-i18n="statistics.errorSubtitle">${I18n.t('statistics.errorSubtitle')}</p>
            </div>
        `;
    }
};

window.Statistics = Statistics;
