// ============================================
// MATCHES MODULE
// Matches display, filtering, and details modal
// ============================================

const Matches = {

    matches: [],
    tournaments: [],
    currentFilter: 'all',
    currentStatusFilter: 'all',

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

        // Filter by status
        if (this.currentStatusFilter === 'upcoming') {
            filteredMatches = filteredMatches.filter(m => m.status === 'scheduled');
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

        // Group matches by date
        const matchesByDate = this.groupMatchesByDate(filteredMatches);

        container.innerHTML = '';

        Object.entries(matchesByDate).forEach(([date, matches]) => {
            const dateSection = this.createDateSection(date, matches);
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

        matches.forEach(match => {
            const date = this.getDateString(match.match_date, lang);

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
        const matchTime = new Date(match.match_date).toLocaleTimeString('en-US', {
            hour: '2-digit', minute: '2-digit', hour12: false
        });

        const t = (key) => window.I18n ? I18n.t(key) : key;

        const team1Score = isFinished ? match.team1_score : '-';
        const team2Score = isFinished ? match.team2_score : '-';

        // Round display
        let roundText = '';
        if (match.round) {
            const roundNum = parseInt(match.round);
            if (!isNaN(roundNum)) {
                roundText = window.I18n ? I18n.t('tournaments.round', {num: roundNum}) : `Round ${roundNum}`;
            } else {
                roundText = match.round;
            }
        }

        return `
            <div class="match-card ${isFinished ? 'finished' : 'scheduled'}"
                 onclick="Matches.openDetailsModal(${match.tournament_id}, ${match.id})"
                 style="cursor: pointer;">
                <div class="match-tournament-badge">
                    <i class="fas fa-trophy"></i> ${match.tournament_name}
                </div>

                <div class="match-content">
                    <div class="match-team team1">
                        <div class="team-logo-small" style="background: ${match.team1_color || '#2ecc71'}">
                            ${match.team1_logo || match.team1_name.replace(/\s+/g, '').substring(0, 3).toUpperCase()}
                        </div>
                        <span class="team-name">${match.team1_name}</span>
                    </div>

                    <div class="match-score-section">
                        ${isFinished ? `
                            <div class="match-score">
                                <span class="score">${team1Score}</span>
                                <span class="score-separator">:</span>
                                <span class="score">${team2Score}</span>
                            </div>
                            <div class="match-status finished">${t('matches.finished')}</div>
                        ` : `
                            <div class="match-time">${matchTime}</div>
                            <div class="match-status scheduled">${t('matches.scheduled')}</div>
                        `}
                    </div>

                    <div class="match-team team2">
                        <span class="team-name">${match.team2_name}</span>
                        <div class="team-logo-small" style="background: ${match.team2_color || '#3498db'}">
                            ${match.team2_logo || match.team2_name.replace(/\s+/g, '').substring(0, 3).toUpperCase()}
                        </div>
                    </div>
                </div>

                <div class="match-footer">
                    ${roundText ? `<span class="match-round">${roundText}</span>` : ''}
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
                `<i class="fas fa-trophy"></i> ${match.tournament_name || ''}`;

            let roundText = '';
            if (match.round) {
                const roundNum = parseInt(match.round);
                roundText = !isNaN(roundNum) ? (window.I18n ? I18n.t('tournaments.round', {num: roundNum}) : `Round ${roundNum}`) : match.round;
            }
            document.getElementById('match-detail-round').textContent = roundText;

            // Score section
            const isFinished = match.status === 'finished';
            const scoreSection = document.getElementById('match-details-score-section');

            scoreSection.innerHTML = `
                <div class="match-details-teams">
                    <div class="match-detail-team">
                        <div class="team-logo-large" style="background: ${match.team1_color || '#2ecc71'}">
                            ${match.team1_logo || match.team1_name.replace(/\s+/g, '').substring(0, 3).toUpperCase()}
                        </div>
                        <span class="team-name-large">${match.team1_name}</span>
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
                            ${match.team2_logo || match.team2_name.replace(/\s+/g, '').substring(0, 3).toUpperCase()}
                        </div>
                        <span class="team-name-large">${match.team2_name}</span>
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

                    let text = `${event.player_name}`;
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
                            <div class="events-column-header">${match.team1_name}</div>
                            ${team1Events.length > 0 ? team1Events.map(formatEvent).join('') : '<p style="color: #666; text-align: center; padding: 8px;">-</p>'}
                        </div>
                        <div class="events-column events-right">
                            <div class="events-column-header">${match.team2_name}</div>
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
