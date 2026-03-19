// ============================================
// MATCHES MODULE
// Matches display, filtering, and details modal
// ============================================

const Matches = {

    matches: [],
    tournaments: [],
    currentFilter: 'all',
    currentStatusFilter: 'all',
    currentTeamFilter: 'all',

    init() {
        this.createDetailsModal();
        this.attachEventListeners();
        this.load();

        window.addEventListener('languageChanged', () => {
            if (window.I18n) {
                I18n.applyTranslations();
            }
            this.render();
        });
    },

    createDetailsModal() {
        const modalHTML = `
            <div class="modal" id="match-details-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content modal-content-large">
                    <button class="modal-close" id="close-match-details">&times;</button>

                    <!-- Match Header -->
                    <div class="match-details-header" id="match-details-header">
                        <div class="match-details-tournament" id="match-detail-tournament"></div>
                        <div class="match-details-round" id="match-detail-round"></div>
                    </div>

                    <!-- Score Section -->
                    <div class="match-details-score" id="match-details-score-section"></div>

                    <!-- Events Section (2 columns) -->
                    <div class="match-details-events" id="match-details-events"></div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('close-match-details')?.addEventListener('click', () => this.closeDetailsModal());
        document.querySelector('#match-details-modal .modal-overlay')?.addEventListener('click', () => this.closeDetailsModal());
    },

    attachEventListeners() {
        const filterSelect = document.getElementById('matches-filter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.currentFilter = e.target.value;
                this.render();
            });
        }

        const statusFilter = document.getElementById('matches-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatusFilter = e.target.value;
                this.render();
            });
        }

        const teamFilter = document.getElementById('matches-team-filter');
        if (teamFilter) {
            teamFilter.addEventListener('change', (e) => {
                this.currentTeamFilter = e.target.value;
                this.render();
            });
        }
    },

    async load() {
        const container = document.getElementById('matches-list');
        if (!container) return;

        UI.showLoading('matches-list');

        try {
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
            this.showEmpty();
        }
    },

    updateFilterOptions() {
        const filterSelect = document.getElementById('matches-filter');
        if (!filterSelect) return;

        const t = (key) => window.I18n ? I18n.t(key) : key;

        filterSelect.innerHTML = `<option value="all">${t('matches.allTournaments')}</option>`;
        this.tournaments.forEach(tournament => {
            const option = document.createElement('option');
            option.value = tournament.id;
            option.textContent = tournament.name;
            filterSelect.appendChild(option);
        });
        filterSelect.value = this.currentFilter;

        // Team filter
        const teamSelect = document.getElementById('matches-team-filter');
        if (!teamSelect) return;

        const teams = new Map();
        this.matches.forEach(m => {
            if (!teams.has(m.team1_id)) teams.set(m.team1_id, m.team1_name);
            if (!teams.has(m.team2_id)) teams.set(m.team2_id, m.team2_name);
        });

        teamSelect.innerHTML = `<option value="all">${t('matches.allTeams')}</option>`;
        [...teams.entries()].sort((a, b) => a[1].localeCompare(b[1])).forEach(([id, name]) => {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = name;
            teamSelect.appendChild(option);
        });
        teamSelect.value = this.currentTeamFilter;
    },

    updateStats() {
        const total = this.matches.length;
        const finished = this.matches.filter(m => m.status === 'finished').length;
        const upcoming = this.matches.filter(m => m.status === 'scheduled').length;

        const totalEl = document.getElementById('total-matches');
        const finishedEl = document.getElementById('finished-matches');
        const upcomingEl = document.getElementById('upcoming-matches');

        if (totalEl) totalEl.textContent = total;
        if (finishedEl) finishedEl.textContent = finished;
        if (upcomingEl) upcomingEl.textContent = upcoming;
    },

    render() {
        const container = document.getElementById('matches-list');
        const emptyState = document.getElementById('matches-empty');

        if (!container) return;

        UI.hideLoading('matches-list');

        // Filter matches by tournament
        let filteredMatches = this.matches;
        if (this.currentFilter !== 'all') {
            filteredMatches = filteredMatches.filter(m => m.tournament_id == this.currentFilter);
        }

        // Filter by team
        if (this.currentTeamFilter !== 'all') {
            filteredMatches = filteredMatches.filter(m =>
                m.team1_id == this.currentTeamFilter || m.team2_id == this.currentTeamFilter
            );
        }

        // Filter by status
        if (this.currentStatusFilter === 'upcoming') {
            filteredMatches = filteredMatches.filter(m => m.status === 'scheduled');
        } else if (this.currentStatusFilter === 'live') {
            filteredMatches = filteredMatches.filter(m => m.status === 'in_progress');
        } else if (this.currentStatusFilter === 'finished') {
            filteredMatches = filteredMatches.filter(m => m.status === 'finished');
        }

        if (filteredMatches.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        container.style.display = 'block';
        if (emptyState) emptyState.style.display = 'none';

        // Sort: scheduled (upcoming) first ascending, finished last descending
        const upcoming = filteredMatches
            .filter(m => m.status === 'scheduled')
            .sort((a, b) => new Date(a.match_date) - new Date(b.match_date));
        const past = filteredMatches
            .filter(m => m.status !== 'scheduled')
            .sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
        filteredMatches = [...upcoming, ...past];

        // Group matches by date
        const matchesByDate = this.groupMatchesByDate(filteredMatches);

        container.innerHTML = '';

        Object.entries(matchesByDate).forEach(([isoKey, group]) => {
            const dateSection = this.createDateSection(group.label, group.matches, group.isToday);
            container.appendChild(dateSection);
        });
    },

    getDateString(dateStr, lang) {
        const d = new Date(dateStr);
        const monthNames = {
            hy: [
                '\u0540\u0578\u0582\u0576\u057e\u0561\u0580',
                '\u0553\u0565\u057f\u0580\u057e\u0561\u0580',
                '\u0544\u0561\u0580\u057f',
                '\u0531\u057a\u0580\u056b\u056c',
                '\u0544\u0561\u0575\u056b\u057d',
                '\u0540\u0578\u0582\u0576\u056b\u057d',
                '\u0540\u0578\u0582\u056c\u056b\u057d',
                '\u0555\u0563\u0578\u057d\u057f\u0578\u057d',
                '\u054d\u0565\u057a\u057f\u0565\u0574\u0562\u0565\u0580',
                '\u0540\u0578\u056f\u057f\u0565\u0574\u0562\u0565\u0580',
                '\u0546\u0578\u0565\u0574\u0562\u0565\u0580',
                '\u0534\u0565\u056f\u0565\u0574\u0562\u0565\u0580'
            ],
            ge: [
                'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
                'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
            ]
        };

        if (monthNames[lang]) {
            const month = monthNames[lang][d.getMonth()];
            return `${d.getDate()} ${month} ${d.getFullYear()}`;
        }

        const localeMap = { en: 'en-US', ru: 'ru-RU' };
        return d.toLocaleDateString(localeMap[lang] || 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    },

    groupMatchesByDate(matches) {
        const groups = {};
        const lang = window.I18n ? I18n.getCurrentLanguage() : 'en';
        const todayISO = new Date().toISOString().split('T')[0];
        const tomorrowISO = new Date(Date.now() + 86400000).toISOString().split('T')[0];
        const t = (key) => window.I18n ? I18n.t(key) : key;

        matches.forEach(match => {
            const isoKey = new Date(match.match_date).toISOString().split('T')[0];

            if (!groups[isoKey]) {
                let label;
                if (isoKey === todayISO) label = t('matches.today') || 'Today';
                else if (isoKey === tomorrowISO) label = t('matches.tomorrow') || 'Tomorrow';
                else label = this.getDateString(match.match_date, lang);

                groups[isoKey] = { label, isToday: isoKey === todayISO, matches: [] };
            }
            groups[isoKey].matches.push(match);
        });

        return groups;
    },

    getPlayoffRoundName(roundNum, tournamentId) {
        const tourneyMatches = this.matches.filter(m =>
            m.tournament_id === tournamentId &&
            m.tournament_type !== 'league' &&
            !isNaN(parseInt(m.round))
        );
        // Use max_teams to determine the total rounds (e.g. 4 teams = 2 rounds)
        // This avoids mislabeling SF as Final when Final match has no DB row yet
        const maxTeams = tourneyMatches[0] && tourneyMatches[0].tournament_max_teams;
        const expectedMaxRound = maxTeams ? Math.round(Math.log2(maxTeams)) : Math.max(...tourneyMatches.map(m => parseInt(m.round)));
        const maxRound = Math.max(expectedMaxRound, Math.max(...tourneyMatches.map(m => parseInt(m.round))));
        const diff = maxRound - roundNum;
        if (diff === 0) return window.I18n ? I18n.t('matches.final') || 'Final' : 'Final';
        if (diff === 1) return window.I18n ? I18n.t('matches.semiFinal') || 'Semi-Final' : 'Semi-Final';
        if (diff === 2) return window.I18n ? I18n.t('matches.quarterFinal') || 'Quarter-Final' : 'Quarter-Final';
        return window.I18n ? I18n.t('matches.roundOf', {n: Math.pow(2, diff + 1)}) || `Round of ${Math.pow(2, diff + 1)}` : `Round of ${Math.pow(2, diff + 1)}`;
    },

    createDateSection(date, matches, isToday) {
        const section = document.createElement('div');
        section.className = 'matches-date-section';

        section.innerHTML = `
            <h3 class="matches-date-header ${isToday ? 'today' : ''}">
                <i class="fas fa-${isToday ? 'star' : 'calendar-day'}"></i> ${date}
                ${isToday ? '<span style="font-size:11px;background:#2ecc71;color:#000;padding:2px 8px;border-radius:10px;margin-left:8px;font-weight:600;vertical-align:middle;">TODAY</span>' : ''}
            </h3>
            <div class="matches-list-items">
                ${matches.map(match => this.createMatchCard(match)).join('')}
            </div>
        `;

        return section;
    },

    createMatchCard(match) {
        const isFinished = match.status === 'finished';
        const isLive = match.status === 'in_progress';
        const matchTime = new Date(match.match_date).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        const t = (key) => window.I18n ? I18n.t(key) : key;
        const team1Score = (isFinished || isLive) ? match.team1_score : null;
        const team2Score = (isFinished || isLive) ? match.team2_score : null;
        const c1 = match.team1_color || '#2ecc71';
        const c2 = match.team2_color || '#3498db';

        // Smart round display
        let roundText = '';
        if (match.round) {
            const roundNum = parseInt(match.round);
            if (!isNaN(roundNum)) {
                if (match.tournament_type === 'league') {
                    roundText = window.I18n ? I18n.t('tournaments.round', {num: roundNum}) : `Round ${roundNum}`;
                } else {
                    roundText = this.getPlayoffRoundName(roundNum, match.tournament_id);
                }
            } else {
                roundText = match.round;
            }
        }

        const statusClass = isFinished ? 'finished' : isLive ? 'in-progress' : 'scheduled';

        // Winner highlight
        const t1Won = isFinished && team1Score > team2Score;
        const t2Won = isFinished && team2Score > team1Score;

        return `
            <div class="match-card ${statusClass}"
                 onclick="Matches.openDetailsModal(${match.tournament_id}, ${match.id})"
                 style="cursor:pointer; background: linear-gradient(to right, ${c1}18 0%, rgba(255,255,255,0.03) 35%, rgba(255,255,255,0.03) 65%, ${c2}18 100%); overflow:hidden;">

                <!-- Top: tournament + round -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span style="font-size:12px; color:#888; display:flex; align-items:center; gap:6px;">
                        <i class="fas fa-trophy" style="color:#f39c12; font-size:10px;"></i>
                        ${UI.escapeHtml(match.tournament_name)}
                    </span>
                    ${roundText ? `<span style="font-size:11px; font-weight:600; color:#aaa; background:rgba(255,255,255,0.07); padding:2px 10px; border-radius:20px;">${roundText}</span>` : ''}
                </div>

                <!-- Main: teams + score -->
                <div class="match-content">
                    <div class="match-team team1">
                        <div class="team-logo-small" style="background:${c1}; box-shadow: 0 2px 8px ${c1}55;">
                            ${UI.escapeHtml(match.team1_logo || match.team1_name.replace(/\s+/g, '').substring(0, 3).toUpperCase())}
                        </div>
                        <span class="team-name" style="${t1Won ? 'color:white; font-weight:700;' : ''}">${UI.escapeHtml(match.team1_name)}</span>
                    </div>

                    <div class="match-score-section">
                        ${isFinished ? `
                            <div class="match-score">
                                <span class="score" style="${t1Won ? 'color:white;' : 'color:#aaa;'}">${team1Score}</span>
                                <span class="score-separator">:</span>
                                <span class="score" style="${t2Won ? 'color:white;' : 'color:#aaa;'}">${team2Score}</span>
                            </div>
                            <div class="match-status finished">${t('matches.finished')}</div>
                        ` : isLive ? `
                            <div class="match-score">
                                <span class="score">${team1Score}</span>
                                <span class="score-separator">:</span>
                                <span class="score">${team2Score}</span>
                            </div>
                            <div class="match-status live">
                                <i class="fas fa-circle" style="font-size:8px;"></i> LIVE
                            </div>
                        ` : `
                            <div class="match-time">${matchTime}</div>
                            <div class="match-status scheduled">${t('matches.scheduled')}</div>
                        `}
                    </div>

                    <div class="match-team team2">
                        <span class="team-name" style="${t2Won ? 'color:white; font-weight:700;' : ''}">${UI.escapeHtml(match.team2_name)}</span>
                        <div class="team-logo-small" style="background:${c2}; box-shadow: 0 2px 8px ${c2}55;">
                            ${UI.escapeHtml(match.team2_logo || match.team2_name.replace(/\s+/g, '').substring(0, 3).toUpperCase())}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    async openDetailsModal(tournamentId, matchId) {
        try {
            const response = await API.request(`/tournaments/${tournamentId}/matches/${matchId}`);
            const match = response.match;

            if (!match) return;

            const t = (key) => window.I18n ? I18n.t(key) : key;
            const lang = window.I18n ? I18n.getCurrentLanguage() : 'en';

            // Tournament & round
            document.getElementById('match-detail-tournament').innerHTML =
                `<i class="fas fa-trophy"></i> ${UI.escapeHtml(match.tournament_name || '')}`;

            let roundText = '';
            if (match.round) {
                const roundNum = parseInt(match.round);
                if (!isNaN(roundNum)) {
                    if (match.tournament_type === 'league') {
                        roundText = window.I18n ? I18n.t('tournaments.round', {num: roundNum}) : `Round ${roundNum}`;
                    } else {
                        roundText = this.getPlayoffRoundName(roundNum, match.tournament_id);
                    }
                } else {
                    roundText = match.round;
                }
            }
            document.getElementById('match-detail-round').textContent = roundText;

            // Score section
            const isFinished = match.status === 'finished';
            const scoreSection = document.getElementById('match-details-score-section');

            scoreSection.innerHTML = `
                <div class="match-details-teams">
                    <div class="match-detail-team">
                        <div class="team-logo-large" style="background: ${match.team1_color || '#2ecc71'}">
                            ${UI.escapeHtml(match.team1_logo || match.team1_name.replace(/\s+/g, '').substring(0, 3).toUpperCase())}
                        </div>
                        <span class="team-name-large">${UI.escapeHtml(match.team1_name)}</span>
                    </div>

                    <div class="match-detail-score-center">
                        ${isFinished ? `
                            <div class="detail-score">
                                <span>${match.team1_score}</span>
                                <span class="separator">:</span>
                                <span>${match.team2_score}</span>
                            </div>
                            <div class="detail-status finished">${t('matches.finished')}</div>
                        ` : `
                            <div class="detail-time">
                                ${new Date(match.match_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                            <div class="detail-date">
                                ${this.getDateString(match.match_date, lang)}
                            </div>
                            <div class="detail-status scheduled">${t('matches.scheduled')}</div>
                        `}
                    </div>

                    <div class="match-detail-team">
                        <div class="team-logo-large" style="background: ${match.team2_color || '#3498db'}">
                            ${UI.escapeHtml(match.team2_logo || match.team2_name.replace(/\s+/g, '').substring(0, 3).toUpperCase())}
                        </div>
                        <span class="team-name-large">${UI.escapeHtml(match.team2_name)}</span>
                    </div>
                </div>
            `;

            // Events section (2 columns: team1 left, team2 right)
            const eventsContainer = document.getElementById('match-details-events');
            const events = match.events || [];

            if (events.length === 0) {
                eventsContainer.innerHTML = `
                    <p style="text-align: center; color: #b0b0b0; padding: 24px;">
                        ${t('match.noEvents')}
                    </p>
                `;
            } else {
                const team1Events = events.filter(e => e.team_id === match.team1_id);
                const team2Events = events.filter(e => e.team_id === match.team2_id);

                const formatEvent = (event) => {
                    let icon = '';
                    if (event.event_type === 'goal') {
                        icon = event.is_own_goal ? '<i class="fas fa-futbol" style="color: #e74c3c;"></i>' : '<i class="fas fa-futbol" style="color: #2ecc71;"></i>';
                    } else if (event.event_type === 'yellow_card') {
                        icon = '<span style="display:inline-block;width:12px;height:16px;background:#f1c40f;border-radius:2px;"></span>';
                    } else if (event.event_type === 'red_card') {
                        icon = '<span style="display:inline-block;width:12px;height:16px;background:#e74c3c;border-radius:2px;"></span>';
                    } else if (event.event_type === 'substitution') {
                        icon = '<i class="fas fa-exchange-alt" style="color: #3498db;"></i>';
                    }

                    let text = UI.escapeHtml(event.player_name);
                    if (event.event_type === 'goal' && event.is_own_goal) {
                        text += ' (OG)';
                    }

                    return `
                        <div class="event-item">
                            <span class="event-minute">${event.minute}'</span>
                            ${icon}
                            <span class="event-player">${text}</span>
                        </div>
                    `;
                };

                eventsContainer.innerHTML = `
                    <h4 style="color: white; margin-bottom: 16px; text-align: center;">
                        <i class="fas fa-list"></i> ${t('match.matchEvents')}
                    </h4>
                    <div class="events-two-columns">
                        <div class="events-column events-left">
                            <div class="events-column-header">${UI.escapeHtml(match.team1_name)}</div>
                            ${team1Events.length > 0 ? team1Events.map(formatEvent).join('') : '<p style="color: #666; text-align: center; padding: 8px;">-</p>'}
                        </div>
                        <div class="events-column events-right">
                            <div class="events-column-header">${UI.escapeHtml(match.team2_name)}</div>
                            ${team2Events.length > 0 ? team2Events.map(formatEvent).join('') : '<p style="color: #666; text-align: center; padding: 8px;">-</p>'}
                        </div>
                    </div>
                `;
            }

            UI.openModal('match-details-modal');

        } catch (error) {
            console.error('Failed to load match details:', error);
            UI.showNotification(error.message || 'Failed to load match details', 'error');
        }
    },

    closeDetailsModal() {
        UI.closeModal('match-details-modal');
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
