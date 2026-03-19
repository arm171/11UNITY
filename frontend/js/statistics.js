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
            const [statsResponse, matchesResponse] = await Promise.all([
                API.request(`/statistics/tournament/${tournamentId}`),
                API.request(`/tournaments/${tournamentId}/matches`)
            ]);
            this.tournamentData = { ...statsResponse, matches: matchesResponse.matches || [] };
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
        const { tournament, standings, topScorers, topAssists, matches } = this.tournamentData;
        const type = tournament.type;

        const topListsHTML = `
            <div class="statistics-lists" style="margin-top: 32px;">
                <div class="statistics-list-card">
                    <h3><i class="fas fa-futbol"></i> ${t('statistics.topScorers')}</h3>
                    ${this.renderTopList((topScorers || []).slice(0, 5), 'goals', 'fas fa-futbol')}
                </div>
                <div class="statistics-list-card">
                    <h3><i class="fas fa-hands-helping"></i> ${t('statistics.topAssists')}</h3>
                    ${this.renderTopList((topAssists || []).slice(0, 5), 'assists', 'fas fa-hands-helping')}
                </div>
            </div>`;

        if (type === 'playoff') {
            container.innerHTML = `
                <div class="standings-section">
                    <h3 style="color:white; margin-bottom:16px;">
                        <i class="fas fa-sitemap"></i> ${t('statistics.bracket') || 'Bracket'}
                    </h3>
                    ${this.renderBracket(matches, tournament.max_teams)}
                </div>
                ${topListsHTML}`;

        } else if (type === 'group_playoff') {
            const playoffNames = ['SF', 'Final', 'QF', 'R16'];
            const groupMatches = matches.filter(m => !playoffNames.includes(String(m.round)) && this.isGroupRound(m.round, matches));
            const playoffMatches = matches.filter(m => playoffNames.includes(String(m.round)) || (!this.isGroupRound(m.round, matches) && !isNaN(parseInt(m.round))));
            container.innerHTML = `
                <div class="standings-section">
                    <h3 style="color:white; margin-bottom:16px;">
                        <i class="fas fa-table"></i> ${t('statistics.standings')}
                    </h3>
                    ${this.renderStandingsTable(standings)}
                </div>
                ${playoffMatches.length > 0 ? `
                <div class="standings-section" style="margin-top:32px;">
                    <h3 style="color:white; margin-bottom:16px;">
                        <i class="fas fa-sitemap"></i> ${t('statistics.bracket') || 'Bracket'}
                    </h3>
                    ${this.renderBracket(playoffMatches, tournament.max_teams)}
                </div>` : ''}
                ${topListsHTML}`;

        } else {
            // league
            container.innerHTML = `
                <div class="standings-section">
                    <h3 style="color:white; margin-bottom:16px;">
                        <i class="fas fa-table"></i> ${t('statistics.standings')}
                    </h3>
                    ${this.renderStandingsTable(standings)}
                </div>
                ${topListsHTML}`;
        }
    },

    isGroupRound(round, allMatches) {
        // Named playoff stages are never group rounds
        const playoffNames = ['SF', 'Final', 'QF', 'R16'];
        if (playoffNames.includes(String(round))) return false;
        // Group rounds start with 'Group'
        if (String(round).startsWith('Group')) return true;
        // Numeric rounds: group stage has more than 2 matches per round
        const roundNum = parseInt(round);
        if (isNaN(roundNum)) return true;
        const matchesInRound = allMatches.filter(m => m.round == round).length;
        return matchesInRound > 2;
    },

    renderBracket(matches, maxTeams) {
        const t = (key) => window.I18n ? I18n.t(key) : key;
        if (!matches || matches.length === 0) {
            return `<p class="statistics-empty">${t('statistics.noData')}</p>`;
        }

        const rounds = {};
        matches.forEach(m => {
            const r = parseInt(m.round) || m.round;
            if (!rounds[r]) rounds[r] = [];
            rounds[r].push(m);
        });

        const playoffOrder = ['R16', 'QF', 'SF', 'Final'];
        const hasNamedRounds = Object.keys(rounds).some(r => playoffOrder.includes(String(r)));

        let sortedRounds;
        if (hasNamedRounds) {
            sortedRounds = Object.keys(rounds).sort((a, b) => {
                const ai = playoffOrder.indexOf(String(a));
                const bi = playoffOrder.indexOf(String(b));
                if (ai !== -1 && bi !== -1) return ai - bi;
                if (ai !== -1) return 1;
                if (bi !== -1) return -1;
                return parseInt(a) - parseInt(b);
            });
        } else {
            sortedRounds = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));
        }

        const getRoundLabel = (roundKey, idx, total) => {
            if (String(roundKey) === 'Final') return t('matches.final') || 'Final';
            if (String(roundKey) === 'SF') return t('matches.semiFinal') || 'Semi-Final';
            if (String(roundKey) === 'QF') return t('matches.quarterFinal') || 'Quarter-Final';
            if (String(roundKey) === 'R16') return 'Round of 16';
            const expectedRounds = maxTeams ? Math.round(Math.log2(maxTeams)) : sortedRounds.length;
            const totalRounds = Math.max(sortedRounds.length, expectedRounds);
            const fromEnd = totalRounds - 1 - idx;
            if (fromEnd === 0) return t('matches.final') || 'Final';
            if (fromEnd === 1) return t('matches.semiFinal') || 'Semi-Final';
            if (fromEnd === 2) return t('matches.quarterFinal') || 'Quarter-Final';
            return `Round of ${Math.pow(2, fromEnd + 1)}`;
        };

        const renderTeam = (name, logo, color, score, isWinner) => `
            <div style="
                display:flex; align-items:center; gap:8px;
                padding:8px 12px;
                background:${isWinner ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.03)'};
                border-left:3px solid ${isWinner ? '#2ecc71' : 'transparent'};
            ">
                <div style="width:28px;height:28px;background:${color||'#555'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11px;color:white;flex-shrink:0;">
                    ${UI.escapeHtml(logo || '?')}
                </div>
                <span style="color:${name?'white':'#555'};font-weight:600;flex:1;font-size:14px;">
                    ${name ? UI.escapeHtml(name) : 'TBD'}
                </span>
                ${score !== null && score !== undefined ? `<span style="color:#2ecc71;font-weight:700;font-size:16px;">${score}</span>` : ''}
            </div>`;

        const renderMatch = (match) => {
            const isFinished = match.status === 'finished';
            const t1w = isFinished && match.team1_score > match.team2_score;
            const t2w = isFinished && match.team2_score > match.team1_score;
            const logo1 = match.team1_logo || (match.team1_name ? match.team1_name.replace(/\s+/g,'').substring(0,3).toUpperCase() : '?');
            const logo2 = match.team2_logo || (match.team2_name ? match.team2_name.replace(/\s+/g,'').substring(0,3).toUpperCase() : '?');
            return `
                <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;">
                    ${renderTeam(match.team1_name, logo1, match.team1_color, isFinished ? match.team1_score : null, t1w)}
                    <div style="height:1px;background:rgba(255,255,255,0.08);"></div>
                    ${renderTeam(match.team2_name, logo2, match.team2_color, isFinished ? match.team2_score : null, t2w)}
                </div>`;
        };

        return `
            <div style="display:flex;gap:24px;overflow-x:auto;padding-bottom:8px;align-items:stretch;">
                ${sortedRounds.map((r, idx) => {
                    const roundMatches = rounds[r].sort((a, b) => (a.bracket_slot||0) - (b.bracket_slot||0));
                    const label = getRoundLabel(r, idx, sortedRounds.length);
                    return `
                        <div style="flex:1;min-width:240px;display:flex;flex-direction:column;">
                            <h4 style="color:#2ecc71;text-align:center;margin-bottom:12px;font-size:13px;text-transform:uppercase;letter-spacing:1px;flex-shrink:0;">
                                ${label}
                            </h4>
                            <div style="flex:1;display:flex;flex-direction:column;justify-content:space-around;gap:8px;">
                                ${roundMatches.map(m => renderMatch(m)).join('')}
                            </div>
                        </div>`;
                }).join('')}
            </div>`;
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
