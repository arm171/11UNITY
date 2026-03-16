// ============================================
// TOURNAMENTS MODULE
// Tournament management functionality
// ============================================

const Tournaments = {

    tournaments: [],
    currentTournament: null,
    currentMatch: null,
    currentCategoryFilter: '',
    currentStatusFilter: '',

    VALID_MAX_TEAMS: {
        league: [4, 8, 12, 16, 32],
        playoff: [4, 8, 16, 32],
        group_playoff: [8, 16, 32]
    },

    init() {
        this.createModals();
        this.attachEventListeners();
        this.load();
    },

    createModals() {
        const modalsHTML = `
            <!-- Create Tournament Modal -->
            <div class="modal" id="create-tournament-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-create-tournament">&times;</button>

                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-trophy"></i> <span data-i18n="tournaments.createTournament">Create Tournament</span>
                    </h2>

                    <form id="create-tournament-form">
                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.tournamentName">Tournament Name</label>
                            <input
                                type="text"
                                class="form-input"
                                id="tournament-name"
                                data-i18n-placeholder="tournaments.tournamentNamePlaceholder"
                                placeholder="Champions League 2026"
                                minlength="3"
                                maxlength="100"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.category">Category</label>
                            <select class="form-select" id="tournament-category" required>
                                <option value="" data-i18n="tournaments.selectCategory">Select category</option>
                                <option value="school" data-i18n="tournaments.categories.school">School</option>
                                <option value="university" data-i18n="tournaments.categories.university">University</option>
                                <option value="amateur" data-i18n="tournaments.categories.amateur">Amateur</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.type">Type</label>
                            <select class="form-select" id="tournament-type" required>
                                <option value="" data-i18n="tournaments.selectType">Select type</option>
                                <option value="league" data-i18n="tournaments.types.league">League (All vs All)</option>
                                <option value="playoff" data-i18n="tournaments.types.playoff">Playoff (Knockout)</option>
                                <option value="group_playoff" data-i18n="tournaments.types.group_playoff">Group + Playoff</option>
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label" data-i18n="tournaments.startDate">Start Date</label>
                                <input
                                    type="date"
                                    class="form-input"
                                    id="tournament-start-date"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label" data-i18n="tournaments.maxTeams">Maximum Teams</label>
                                <select class="form-select" id="tournament-max-teams" required>
                                    <option value="" data-i18n="tournaments.selectTypeFirst">Select type first</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.minPlayersPerTeam">Min Players Per Team</label>
                            <select class="form-select" id="tournament-min-players" required>
                                <option value="7">7</option>
                                <option value="9">9</option>
                                <option value="11" selected>11</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.venue">Venue</label>
                            <input
                                type="text"
                                class="form-input"
                                id="tournament-venue"
                                data-i18n-placeholder="tournaments.venuePlaceholder"
                                placeholder="School gym #5, Stadium Ararat..."
                                maxlength="255"
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.description">Description</label>
                            <textarea
                                class="form-textarea"
                                id="tournament-description"
                                data-i18n-placeholder="tournaments.descriptionPlaceholder"
                                placeholder="Tournament details..."
                                rows="4"
                            ></textarea>
                        </div>

                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Tournaments.closeCreateModal()">
                                <span data-i18n="common.cancel">Cancel</span>
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text" data-i18n="tournaments.createTournament">Create Tournament</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Edit Tournament Modal -->
            <div class="modal" id="edit-tournament-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-edit-tournament">&times;</button>

                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-edit"></i> <span data-i18n="tournaments.editTournament">Edit Tournament</span>
                    </h2>

                    <form id="edit-tournament-form">
                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.tournamentName">Tournament Name</label>
                            <input
                                type="text"
                                class="form-input"
                                id="edit-tournament-name"
                                data-i18n-placeholder="tournaments.tournamentNamePlaceholder"
                                placeholder="Champions League 2026"
                                minlength="3"
                                maxlength="100"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.category">Category</label>
                            <select class="form-select" id="edit-tournament-category" required>
                                <option value="" data-i18n="tournaments.selectCategory">Select category</option>
                                <option value="school" data-i18n="tournaments.categories.school">School</option>
                                <option value="university" data-i18n="tournaments.categories.university">University</option>
                                <option value="amateur" data-i18n="tournaments.categories.amateur">Amateur</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.type">Type</label>
                            <select class="form-select" id="edit-tournament-type" required>
                                <option value="" data-i18n="tournaments.selectType">Select type</option>
                                <option value="league" data-i18n="tournaments.types.league">League (All vs All)</option>
                                <option value="playoff" data-i18n="tournaments.types.playoff">Playoff (Knockout)</option>
                                <option value="group_playoff" data-i18n="tournaments.types.group_playoff">Group + Playoff</option>
                            </select>
                        </div>

                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                            <div class="form-group">
                                <label class="form-label" data-i18n="tournaments.startDate">Start Date</label>
                                <input
                                    type="date"
                                    class="form-input"
                                    id="edit-tournament-start-date"
                                    required
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label" data-i18n="tournaments.maxTeams">Maximum Teams</label>
                                <select class="form-select" id="edit-tournament-max-teams" required>
                                    <option value="" data-i18n="tournaments.selectTypeFirst">Select type first</option>
                                </select>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.minPlayersPerTeam">Min Players Per Team</label>
                            <select class="form-select" id="edit-tournament-min-players" required>
                                <option value="7">7</option>
                                <option value="9">9</option>
                                <option value="11" selected>11</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.venue">Venue</label>
                            <input
                                type="text"
                                class="form-input"
                                id="edit-tournament-venue"
                                data-i18n-placeholder="tournaments.venuePlaceholder"
                                placeholder="Stadium or location name"
                                maxlength="255"
                            >
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.description">Description</label>
                            <textarea
                                class="form-textarea"
                                id="edit-tournament-description"
                                data-i18n-placeholder="tournaments.descriptionPlaceholder"
                                placeholder="Tournament details..."
                                rows="4"
                            ></textarea>
                        </div>

                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Tournaments.closeEditModal()">
                                <span data-i18n="common.cancel">Cancel</span>
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text" data-i18n="tournaments.saveTournament">Save Changes</span>
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

                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px;">
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-calendar-alt"></i>
                            <span id="modal-tournament-date">Date</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-tag"></i>
                            <span id="modal-tournament-category">Category</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-users"></i>
                            <span id="modal-tournament-teams">Teams</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;">
                            <i class="fas fa-list"></i>
                            <span id="modal-tournament-type">Type</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px; color: #b0b0b0;" id="modal-tournament-venue-row">
                            <i class="fas fa-map-marker-alt"></i>
                            <span id="modal-tournament-venue"></span>
                        </div>
                    </div>

                    <p style="color: #b0b0b0; line-height: 1.6; margin-bottom: 32px;" id="modal-tournament-description">
                        Description
                    </p>

                    <div style="text-align: center; margin-bottom: 32px;">
                        <button class="btn btn-primary" id="join-tournament-btn" style="display: none;">
                            <i class="fas fa-plus-circle"></i> <span data-i18n="tournaments.joinTournament">Join Tournament</span>
                        </button>
                        <button class="btn btn-danger" id="leave-tournament-btn" style="display: none;">
                            <i class="fas fa-sign-out-alt"></i> <span data-i18n="tournaments.leaveTournament">Leave Tournament</span>
                        </button>
                        <p id="join-tournament-status" style="margin-top: 16px; display: none; font-size: 16px; font-weight: 600;">
                            <i class="fas fa-check-circle"></i> <span id="join-status-text"></span>
                        </p>
                    </div>

                    <div id="tournament-owner-actions" style="display: none; margin-bottom: 24px; text-align: center;">
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button class="btn btn-secondary" id="edit-tournament-btn">
                                <i class="fas fa-edit"></i> <span data-i18n="tournaments.editTournament">Edit Tournament</span>
                            </button>
                            <button class="btn btn-danger" id="delete-tournament-btn">
                                <i class="fas fa-trash"></i> <span data-i18n="tournaments.deleteTournament">Delete Tournament</span>
                            </button>
                        </div>
                    </div>

<div style="text-align: center; margin-bottom: 32px;">
                        <button class="btn btn-primary" id="generate-fixtures-btn" style="display: none;">
                            <i class="fas fa-magic"></i> <span data-i18n="tournaments.generateFixtures">Generate Fixtures</span>
                        </button>
                    </div>

                    <!-- Tabs for Standings, Statistics, Fixtures -->
                    <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
                        <button class="btn btn-secondary tournament-tab active" data-tab="standings" onclick="Tournaments.switchTab('standings')">
                            <i class="fas fa-table"></i> <span data-i18n="tournaments.standings">Standings</span>
                        </button>
                        <button class="btn btn-secondary tournament-tab" data-tab="statistics" onclick="Tournaments.switchTab('statistics')">
                            <i class="fas fa-chart-bar"></i> <span data-i18n="tournaments.statistics">Statistics</span>
                        </button>
                        <button class="btn btn-secondary tournament-tab" data-tab="fixtures" onclick="Tournaments.switchTab('fixtures')">
                            <i class="fas fa-calendar-alt"></i> <span data-i18n="tournaments.fixtures">Fixtures</span>
                        </button>
                    </div>

                    <!-- Standings Tab -->
                    <div id="tournament-standings-tab" class="tournament-tab-content">
                        <div id="tournament-standings-container" style="display: none;">
                            <div id="tournament-standings-table"></div>
                        </div>
                        <div class="empty-state" id="tournament-no-standings">
                            <div class="empty-icon"><i class="fas fa-table"></i></div>
                            <h3 class="empty-title" data-i18n="tournaments.noStandings">No Standings Yet</h3>
                            <p class="empty-subtitle" data-i18n="tournaments.standingsSubtitle">Standings will appear after matches are played</p>
                        </div>
                    </div>

                    <!-- Statistics Tab -->
                    <div id="tournament-statistics-tab" class="tournament-tab-content" style="display: none;">
                        <div id="tournament-statistics-container" style="display: none;">
                            <div id="tournament-statistics-list"></div>
                        </div>
                        <div class="empty-state" id="tournament-no-statistics">
                            <div class="empty-icon"><i class="fas fa-chart-bar"></i></div>
                            <h3 class="empty-title" data-i18n="tournaments.noStatistics">No Statistics Yet</h3>
                            <p class="empty-subtitle" data-i18n="tournaments.statisticsSubtitle">Player statistics will appear after match events are recorded</p>
                        </div>
                    </div>

                    <!-- Fixtures Tab -->
                    <div id="tournament-fixtures-tab" class="tournament-tab-content" style="display: none;">
                        <div id="tournament-fixtures-container" style="display: none;">
                            <div id="tournament-fixtures-list"></div>
                        </div>
                        <div class="empty-state" id="tournament-no-fixtures">
                            <div class="empty-icon"><i class="fas fa-calendar-alt"></i></div>
                            <h3 class="empty-title" data-i18n="tournaments.noFixtures">No Fixtures Yet</h3>
                            <p class="empty-subtitle" data-i18n="tournaments.fixturesSubtitle">Generate fixtures to see the match schedule!</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Fixtures Settings Modal -->
            <div class="modal" id="fixtures-settings-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content">
                    <button class="modal-close" id="close-fixtures-settings">&times;</button>

                    <h2 style="margin-bottom: 32px; text-align: center; color: white;">
                        <i class="fas fa-magic"></i> <span data-i18n="fixturesSettings.title">Generate Fixtures Settings</span>
                    </h2>

                    <form id="fixtures-settings-form">
                        <div class="form-group">
                            <label class="form-label" data-i18n="tournaments.startDate">Start Date</label>
                            <input type="date" class="form-input" id="fixtures-start-date" required onchange="Tournaments.updateEstimatedEndDate()">
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="fixturesSettings.matchTime">Match Time</label>
                            <input type="time" class="form-input" id="fixtures-match-time" value="18:00" required>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="fixturesSettings.matchDays">Match Days</label>
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="1"> <span data-i18n="fixturesSettings.days.mon">Mon</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="2"> <span data-i18n="fixturesSettings.days.tue">Tue</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="3" checked> <span data-i18n="fixturesSettings.days.wed">Wed</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="4"> <span data-i18n="fixturesSettings.days.thu">Thu</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="5" checked> <span data-i18n="fixturesSettings.days.fri">Fri</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="6"> <span data-i18n="fixturesSettings.days.sat">Sat</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 4px; color: white;">
                                    <input type="checkbox" name="match-days" value="0"> <span data-i18n="fixturesSettings.days.sun">Sun</span>
                                </label>
                            </div>
                        </div>

                        <div class="form-group">
                            <label class="form-label" data-i18n="fixturesSettings.matchesPerDay">Matches Per Day</label>
                            <select class="form-select" id="fixtures-matches-per-day" required onchange="Tournaments.updateEstimatedEndDate()">
                                <option value="1">1</option>
                                <option value="2" selected>2</option>
                                <option value="3">3</option>
                            </select>
                        </div>

                        <div id="estimated-end-date-block" style="display: none; padding: 12px 16px; background: rgba(46,204,113,0.1); border: 1px solid rgba(46,204,113,0.3); border-radius: 8px; color: #2ecc71; font-size: 14px; margin-bottom: 8px;">
                            <i class="fas fa-calendar-check"></i> <span data-i18n="fixturesSettings.estimatedEnd">Tournament will end approximately:</span>
                            <strong id="estimated-end-date-value" style="margin-left: 6px;"></strong>
                        </div>

                        <div style="display: flex; gap: 16px; margin-top: 24px;">
                            <button type="button" class="btn btn-secondary" style="flex: 1;" onclick="Tournaments.closeFixturesSettingsModal()">
                                <span data-i18n="common.cancel">Cancel</span>
                            </button>
                            <button type="submit" class="btn btn-primary" style="flex: 1;">
                                <span class="btn-text" data-i18n="fixturesSettings.generate">Generate</span>
                                <div class="spinner" style="display: none;"></div>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Match Results Modal -->
            <div class="modal" id="match-results-modal">
                <div class="modal-overlay"></div>
                <div class="modal-content modal-content-large">
                    <button class="modal-close" id="close-match-results">&times;</button>

                    <h2 style="margin-bottom: 24px; text-align: center; color: white;">
                        <i class="fas fa-futbol"></i> <span data-i18n="match.enterResults">Match Management</span>
                    </h2>

                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;" id="match-team1-logo">T1</div>
                            <div style="font-size: 18px; font-weight: bold; color: white;" id="match-team1-name">Team 1</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 36px; font-weight: bold; color: #2ecc71;" id="match-score-display">0 - 0</div>
                            <div style="color: #b0b0b0; font-size: 12px; margin-top: 4px;" id="match-status-display"></div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 32px; margin-bottom: 8px;" id="match-team2-logo">T2</div>
                            <div style="font-size: 18px; font-weight: bold; color: white;" id="match-team2-name">Team 2</div>
                        </div>
                    </div>

                    <div id="match-management-forms" style="display: none;">
                        <div style="margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                            <h3 style="color: white; margin-bottom: 16px;">
                                <i class="fas fa-futbol"></i> <span data-i18n="match.addGoal">Add Goal</span>
                            </h3>
                            <form id="add-goal-form">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label" data-i18n="match.team">Team</label>
                                        <select class="form-select" id="goal-team" required>
                                            <option value="" data-i18n="match.selectTeam">Select team</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" data-i18n="match.player">Player</label>
                                        <select class="form-select" id="goal-player" required>
                                            <option value="" data-i18n="match.selectPlayer">Select player</option>
                                        </select>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label" data-i18n="match.minute">Minute</label>
                                        <input type="number" class="form-input" id="goal-minute" min="1" max="120" placeholder="45" required>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" data-i18n="match.assist">Assist</label>
                                        <select class="form-select" id="goal-assist">
                                            <option value="">—</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="display: flex; align-items: flex-end;">
                                        <label style="display: flex; align-items: center; gap: 8px; color: white; padding-bottom: 12px; cursor: pointer;">
                                            <input type="checkbox" id="goal-own-goal">
                                            <span data-i18n="match.ownGoal">Own Goal</span>
                                        </label>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary" style="width: 100%;">
                                    <span class="btn-text"><i class="fas fa-plus"></i> <span data-i18n="match.addGoal">Add Goal</span></span>
                                    <div class="spinner" style="display: none;"></div>
                                </button>
                            </form>
                        </div>

                        <div style="margin-bottom: 32px; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                            <h3 style="color: white; margin-bottom: 16px;">
                                <i class="fas fa-square"></i> <span data-i18n="match.addCard">Add Card</span>
                            </h3>
                            <form id="add-card-form">
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label" data-i18n="match.team">Team</label>
                                        <select class="form-select" id="card-team" required>
                                            <option value="" data-i18n="match.selectTeam">Select team</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" data-i18n="match.player">Player</label>
                                        <select class="form-select" id="card-player" required>
                                            <option value="" data-i18n="match.selectPlayer">Select player</option>
                                        </select>
                                    </div>
                                </div>
                                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                                    <div class="form-group">
                                        <label class="form-label" data-i18n="match.cardType">Card Type</label>
                                        <select class="form-select" id="card-type" required>
                                            <option value="" data-i18n="match.selectCardType">Select type</option>
                                            <option value="yellow_card" data-i18n="match.yellowCard">Yellow Card</option>
                                            <option value="red_card" data-i18n="match.redCard">Red Card</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label class="form-label" data-i18n="match.minute">Minute</label>
                                        <input type="number" class="form-input" id="card-minute" min="1" max="120" placeholder="67" required>
                                    </div>
                                </div>
                                <button type="submit" class="btn btn-primary" style="width: 100%;">
                                    <span class="btn-text"><i class="fas fa-plus"></i> <span data-i18n="match.addCard">Add Card</span></span>
                                    <div class="spinner" style="display: none;"></div>
                                </button>
                            </form>
                        </div>

                        <div style="text-align: center; margin-bottom: 32px;">
                            <button class="btn btn-success" id="finish-match-btn" style="padding: 12px 48px; font-size: 16px;">
                                <i class="fas fa-flag-checkered"></i> <span data-i18n="match.finishMatch">Finish Match</span>
                            </button>
                        </div>
                    </div>

                    <div style="padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px;">
                        <h3 style="color: white; margin-bottom: 16px;">
                            <i class="fas fa-list"></i> <span data-i18n="match.matchEvents">Match Events</span>
                        </h3>
                        <div id="match-events-list"></div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalsHTML);

        // Apply translations to newly created modals
        if (window.I18n) {
            I18n.applyTranslations();
        }
    },

    attachEventListeners() {
        // Listen for language changes to update dynamic content
        window.addEventListener('languageChanged', () => {
            if (window.I18n) {
                I18n.applyTranslations();
            }
            this.render();
            if (this.currentTournament && document.getElementById('tournament-details-modal').classList.contains('active')) {
                this.loadStandings(this.currentTournament.id);
                this.loadStatistics(this.currentTournament.id);
                this.loadTournamentFixtures(this.currentTournament.id);
            }
        });

        const createBtn = document.getElementById('create-tournament-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.openCreateModal());
        }

        // Status filter (client-side)
        const statusFilter = document.getElementById('tournaments-status-filter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentStatusFilter = e.target.value;
                this.render();
            });
        }

        // Category filter
        const categoryFilter = document.getElementById('tournaments-category-filter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentCategoryFilter = e.target.value;
                this.load();
            });
        }

        // Dynamic max teams based on tournament type
        document.getElementById('tournament-type')?.addEventListener('change', () => this.updateMaxTeamsOptions());

        // Goal form: team change → update player dropdown
        document.getElementById('goal-team')?.addEventListener('change', () => this.updateGoalPlayerDropdown());
        // Goal form: own goal checkbox → toggle assist
        document.getElementById('goal-own-goal')?.addEventListener('change', () => this.updateAssistDropdown());
        // Goal form: player change → update assist dropdown
        document.getElementById('goal-player')?.addEventListener('change', () => this.updateAssistDropdown());
        // Card form: team change → update player dropdown
        document.getElementById('card-team')?.addEventListener('change', () => this.updateCardPlayerDropdown());

        document.getElementById('close-create-tournament')?.addEventListener('click', () => this.closeCreateModal());
        document.getElementById('close-tournament-details')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('close-fixtures-settings')?.addEventListener('click', () => this.closeFixturesSettingsModal());
        document.getElementById('close-match-results')?.addEventListener('click', () => this.closeMatchResultsModal());

        document.querySelector('#create-tournament-modal .modal-overlay')?.addEventListener('click', () => this.closeCreateModal());
        document.querySelector('#tournament-details-modal .modal-overlay')?.addEventListener('click', () => this.closeDetailsModal());
        document.querySelector('#fixtures-settings-modal .modal-overlay')?.addEventListener('click', () => this.closeFixturesSettingsModal());
        document.querySelector('#match-results-modal .modal-overlay')?.addEventListener('click', () => this.closeMatchResultsModal());

        document.getElementById('create-tournament-form')?.addEventListener('submit', (e) => this.handleCreate(e));
        document.getElementById('edit-tournament-form')?.addEventListener('submit', (e) => this.handleEdit(e));
        document.getElementById('fixtures-settings-form')?.addEventListener('submit', (e) => this.handleGenerateFixtures(e));
        document.getElementById('add-goal-form')?.addEventListener('submit', (e) => this.handleAddGoal(e));
        document.getElementById('add-card-form')?.addEventListener('submit', (e) => this.handleAddCard(e));
        document.getElementById('finish-match-btn')?.addEventListener('click', () => this.handleFinishMatch());

        // Edit/Delete tournament buttons
        document.getElementById('edit-tournament-btn')?.addEventListener('click', () => this.openEditModal());
        document.getElementById('delete-tournament-btn')?.addEventListener('click', () => this.handleDeleteTournament());

        // Edit modal close
        document.getElementById('close-edit-tournament')?.addEventListener('click', () => this.closeEditModal());
        document.querySelector('#edit-tournament-modal .modal-overlay')?.addEventListener('click', () => this.closeEditModal());

        // Edit tournament type change -> update max teams
        document.getElementById('edit-tournament-type')?.addEventListener('change', () => this.updateEditMaxTeamsOptions());
    },

    updateMaxTeamsOptions() {
        const type = document.getElementById('tournament-type').value;
        const maxTeamsSelect = document.getElementById('tournament-max-teams');

        if (!type || !this.VALID_MAX_TEAMS[type]) {
            maxTeamsSelect.innerHTML = `<option value="" data-i18n="tournaments.selectTypeFirst">Select type first</option>`;
            return;
        }

        const options = this.VALID_MAX_TEAMS[type];
        maxTeamsSelect.innerHTML = options.map(val =>
            `<option value="${val}" ${val === 8 ? 'selected' : ''}>${val}</option>`
        ).join('');
    },

    async load() {
        try {
            UI.showLoading('tournaments-list');

            let endpoint = CONFIG.ENDPOINTS.TOURNAMENTS;
            if (this.currentCategoryFilter) {
                endpoint += `?category=${encodeURIComponent(this.currentCategoryFilter)}`;
            }

            const response = await API.request(endpoint);
            this.tournaments = response.tournaments || [];

            this.updateStats();
            this.render();

        } catch (error) {
            console.error('Failed to load tournaments:', error);
            UI.showNotification(I18n.t('messages.error.loadTournaments'), 'error');
            this.showEmpty();
        }
    },

    updateStats() {
        const total = this.tournaments.length;
        const active = this.tournaments.filter(t => t.status === 'active').length;
        const upcoming = this.tournaments.filter(t => t.status === 'upcoming').length;
        const finished = this.tournaments.filter(t => t.status === 'finished').length;

        document.getElementById('total-tournaments').textContent = total;
        document.getElementById('active-tournaments').textContent = active;
        const upcomingEl = document.getElementById('upcoming-tournaments');
        if (upcomingEl) upcomingEl.textContent = upcoming;
        document.getElementById('finished-tournaments').textContent = finished;
    },

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

        const filtered = this.currentStatusFilter
            ? this.tournaments.filter(t => t.status === this.currentStatusFilter)
            : this.tournaments;

        if (filtered.length === 0) {
            container.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        filtered.forEach(tournament => {
            const card = this.createCard(tournament);
            container.appendChild(card);
        });
    },

    createCard(tournament) {
        const card = document.createElement('div');
        card.className = 'card tournament-card';
        card.onclick = () => this.openDetailsModal(tournament);

        const startDate = UI.formatDate(tournament.start_date);
        const statusClass = `badge-${tournament.status}`;
        const statusText = I18n.t(`tournaments.${tournament.status}`);
        const categoryText = this.getCategoryLabel(tournament.category);

        card.innerHTML = `
            <div class="tournament-header">
                <h3 class="tournament-title">${UI.escapeHtml(tournament.name)}</h3>
                <span class="badge ${statusClass}">${statusText}</span>
            </div>

            <div class="tournament-meta">
                <div class="meta-item">
                    <i class="fas fa-calendar-alt"></i>
                    <span>${startDate}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-tag"></i>
                    <span>${categoryText}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${I18n.t('tournaments.teamsJoined', { current: tournament.teams_count || 0, max: tournament.max_teams })}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-list"></i>
                    <span>${this.getTypeLabel(tournament.type)}</span>
                </div>
            </div>

            ${tournament.description ? `<div class="tournament-description">${UI.escapeHtml(tournament.description)}</div>` : ''}

            <div class="tournament-footer">
                <i class="fas fa-user"></i>
                <span>${UI.escapeHtml(tournament.organizer_name || I18n.t('common.unknown'))}</span>
            </div>
        `;

        return card;
    },

    getCategoryLabel(category) {
        if (!category) return '';
        return I18n.t(`tournaments.categories.${category}`) || category;
    },

    getTypeLabel(type) {
        return I18n.t(`tournaments.types.${type}`) || type;
    },

    showEmpty() {
        const container = document.getElementById('tournaments-list');
        const emptyState = document.getElementById('tournaments-empty');

        UI.hideLoading('tournaments-list');

        if (container) container.style.display = 'none';
        if (emptyState) emptyState.style.display = 'flex';
    },

    openCreateModal() {
        if (!API.isAuthenticated()) {
            UI.showNotification(I18n.t('messages.error.unauthorized'), 'error');
            Auth.openAuthModal('login');
            return;
        }

        const user = API.getUser();
        if (user.role !== 'organizer') {
            UI.showNotification(I18n.t('messages.error.onlyOrganizers'), 'error');
            return;
        }

        UI.openModal('create-tournament-modal');
    },

    closeCreateModal() {
        UI.closeModal('create-tournament-modal');
        document.getElementById('create-tournament-form').reset();
        // Reset max teams dropdown
        const maxTeamsSelect = document.getElementById('tournament-max-teams');
        if (maxTeamsSelect) {
            maxTeamsSelect.innerHTML = `<option value="" data-i18n="tournaments.selectTypeFirst">Select type first</option>`;
        }
    },

    updateEditMaxTeamsOptions(selectedValue) {
        const type = document.getElementById('edit-tournament-type').value;
        const maxTeamsSelect = document.getElementById('edit-tournament-max-teams');

        if (!type || !this.VALID_MAX_TEAMS[type]) {
            maxTeamsSelect.innerHTML = `<option value="" data-i18n="tournaments.selectTypeFirst">Select type first</option>`;
            return;
        }

        const options = this.VALID_MAX_TEAMS[type];
        maxTeamsSelect.innerHTML = options.map(val =>
            `<option value="${val}" ${val === parseInt(selectedValue) ? 'selected' : ''}>${val}</option>`
        ).join('');
    },

    openEditModal() {
        if (!this.currentTournament) return;

        const t = this.currentTournament;

        document.getElementById('edit-tournament-name').value = t.name || '';
        document.getElementById('edit-tournament-category').value = t.category || '';
        document.getElementById('edit-tournament-type').value = t.type || '';

        // Update max teams options based on type, then select the current value
        this.updateEditMaxTeamsOptions(t.max_teams);

        // Format date for the date input (YYYY-MM-DD)
        if (t.start_date) {
            const date = new Date(t.start_date);
            const formatted = date.toISOString().split('T')[0];
            document.getElementById('edit-tournament-start-date').value = formatted;
        }

        document.getElementById('edit-tournament-min-players').value = t.min_players_per_team || 11;
        document.getElementById('edit-tournament-venue').value = t.location || '';
        document.getElementById('edit-tournament-description').value = t.description || '';

        UI.openModal('edit-tournament-modal');
    },

    closeEditModal() {
        UI.closeModal('edit-tournament-modal');
        document.getElementById('edit-tournament-form').reset();
        // Reset max teams dropdown
        const maxTeamsSelect = document.getElementById('edit-tournament-max-teams');
        if (maxTeamsSelect) {
            maxTeamsSelect.innerHTML = `<option value="" data-i18n="tournaments.selectTypeFirst">Select type first</option>`;
        }
    },

    async handleEdit(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        UI.showButtonLoading(submitBtn);

        try {
            const tournamentData = {
                name: document.getElementById('edit-tournament-name').value.trim(),
                category: document.getElementById('edit-tournament-category').value,
                type: document.getElementById('edit-tournament-type').value,
                startDate: document.getElementById('edit-tournament-start-date').value,
                location: document.getElementById('edit-tournament-venue').value.trim(),
                description: document.getElementById('edit-tournament-description').value.trim(),
                maxTeams: parseInt(document.getElementById('edit-tournament-max-teams').value),
                minPlayersPerTeam: parseInt(document.getElementById('edit-tournament-min-players').value),
            };

            await API.updateTournament(this.currentTournament.id, tournamentData);

            UI.showNotification(I18n.t('messages.success.tournamentUpdated') || 'Tournament updated successfully', 'success');

            this.closeEditModal();
            this.closeDetailsModal();
            await this.load();
            if (window.Statistics) Statistics.load();
            if (window.Auth) Auth.updateProfileStats(API.getUser());

        } catch (error) {
            console.error('Failed to update tournament:', error);
            UI.showNotification(error.message || I18n.t('messages.error.updateTournament') || 'Failed to update tournament', 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async handleDeleteTournament() {
        if (!this.currentTournament) return;

        const confirmMsg = I18n.t('tournaments.confirmDelete') || 'Are you sure you want to delete this tournament? This action cannot be undone.';
        if (!confirm(confirmMsg)) return;

        try {
            await API.deleteTournament(this.currentTournament.id);

            UI.showNotification(I18n.t('messages.success.tournamentDeleted') || 'Tournament deleted successfully', 'success');

            this.closeDetailsModal();
            await this.load();
            if (window.Statistics) Statistics.load();
            if (window.Auth) Auth.updateProfileStats(API.getUser());

        } catch (error) {
            console.error('Failed to delete tournament:', error);
            UI.showNotification(error.message || I18n.t('messages.error.deleteTournament') || 'Failed to delete tournament', 'error');
        }
    },

    async handleCreate(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');

        UI.showButtonLoading(submitBtn);

        try {
            const tournamentData = {
                name: document.getElementById('tournament-name').value.trim(),
                category: document.getElementById('tournament-category').value,
                type: document.getElementById('tournament-type').value,
                startDate: document.getElementById('tournament-start-date').value,
                location: document.getElementById('tournament-venue').value.trim(),
                description: document.getElementById('tournament-description').value.trim(),
                maxTeams: parseInt(document.getElementById('tournament-max-teams').value),
                minPlayersPerTeam: parseInt(document.getElementById('tournament-min-players').value),
            };

            await API.createTournament(tournamentData);

            UI.showNotification(I18n.t('messages.success.tournamentCreated'), 'success');

            this.closeCreateModal();
            await this.load();
            if (window.Statistics) Statistics.load();
            if (window.Auth) Auth.updateProfileStats(API.getUser());

        } catch (error) {
            console.error('Failed to create tournament:', error);
            UI.showNotification(error.message || I18n.t('messages.error.createTournament'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async openDetailsModal(tournament) {
        this.currentTournament = tournament;

        // Join WebSocket room for real-time updates
        if (window.WebSocketManager) {
            WebSocketManager.joinTournament(tournament.id);
        }

        document.getElementById('modal-tournament-name').textContent = tournament.name;

        const statusBadge = document.getElementById('modal-tournament-status');
        statusBadge.className = `badge badge-${tournament.status}`;
        statusBadge.textContent = I18n.t(`tournaments.${tournament.status}`);

        const startDate = UI.formatDate(tournament.start_date);
        document.getElementById('modal-tournament-date').textContent = startDate;

        document.getElementById('modal-tournament-category').textContent = this.getCategoryLabel(tournament.category);
        document.getElementById('modal-tournament-teams').textContent = I18n.t('tournaments.teamsJoined', { current: tournament.teams_count || 0, max: tournament.max_teams });
        document.getElementById('modal-tournament-type').textContent = this.getTypeLabel(tournament.type);
        const venueRow = document.getElementById('modal-tournament-venue-row');
        const venueEl = document.getElementById('modal-tournament-venue');
        if (tournament.location) {
            venueEl.textContent = tournament.location;
            venueRow.style.display = 'flex';
        } else {
            venueRow.style.display = 'none';
        }
        const descEl = document.getElementById('modal-tournament-description');
        if (tournament.description) {
            descEl.textContent = tournament.description;
            descEl.style.display = '';
        } else {
            descEl.textContent = '';
            descEl.style.display = 'none';
        }

        await this.updateJoinButton(tournament);
        await this.updateGenerateFixturesButton(tournament);

        // Show/hide edit & delete buttons for tournament owner
        const user = API.getUser();
        const isOwner = user && user.role === 'organizer' && tournament.organizer_id === user.id;
        const ownerActions = document.getElementById('tournament-owner-actions');
        if (ownerActions) {
            ownerActions.style.display = (isOwner && tournament.status === 'upcoming') ? 'block' : 'none';
        }

        // Load all tabs data
        await Promise.all([
            this.loadStandings(tournament.id),
            this.loadStatistics(tournament.id),
            this.loadTournamentFixtures(tournament.id)
        ]);

        // Set default tab to standings
        this.switchTab('standings');

        UI.openModal('tournament-details-modal');
    },

    switchTab(tabName) {
        document.querySelectorAll('.tournament-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        document.querySelectorAll('.tournament-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`tournament-${tabName}-tab`).style.display = 'block';
    },

    async loadStandings(tournamentId) {
        const container = document.getElementById('tournament-standings-container');
        const noStandings = document.getElementById('tournament-no-standings');
        const type = this.currentTournament ? this.currentTournament.type : 'league';

        try {
            if (type === 'playoff') {
                // Bracket view
                const matchesResp = await API.getTournamentMatches(tournamentId);
                const matches = matchesResp.matches || [];
                if (matches.length === 0) {
                    container.style.display = 'none';
                    noStandings.style.display = 'flex';
                } else {
                    this.renderBracket(matches);
                }
                return;
            }

            if (type === 'group_playoff') {
                const [standingsResp, matchesResp] = await Promise.all([
                    API.getStandings(tournamentId),
                    API.getTournamentMatches(tournamentId)
                ]);
                const standings = standingsResp.standings || [];
                const matches = matchesResp.matches || [];
                if (standings.length === 0 && matches.length === 0) {
                    container.style.display = 'none';
                    noStandings.style.display = 'flex';
                } else {
                    this.renderGroupPlayoffStandings(standings, matches);
                }
                return;
            }

            // League: normal standings table
            const response = await API.getStandings(tournamentId);
            const standings = response.standings || [];
            if (standings.length === 0) {
                container.style.display = 'none';
                noStandings.style.display = 'flex';
                return;
            }
            this.renderStandingsFromData(standings);

        } catch (error) {
            console.error('Failed to load standings:', error);
            container.style.display = 'none';
            noStandings.style.display = 'flex';
        }
    },

    // ── Playoff Bracket ──────────────────────────────────────────────────────

    renderBracket(matches) {
        const container = document.getElementById('tournament-standings-container');
        const table = document.getElementById('tournament-standings-table');
        const noStandings = document.getElementById('tournament-no-standings');

        // Group matches by round number (1, 2, 3...)
        const rounds = {};
        matches.forEach(m => {
            const r = parseInt(m.round) || m.round;
            if (!rounds[r]) rounds[r] = [];
            rounds[r].push(m);
        });

        const sortedRounds = Object.keys(rounds).sort((a, b) => parseInt(a) - parseInt(b));
        const totalRounds = sortedRounds.length;

        const getRoundLabel = (idx, total) => {
            const fromEnd = total - 1 - idx;
            if (fromEnd === 0) return I18n.t('tournaments.bracketFinal', 'Final');
            if (fromEnd === 1) return I18n.t('tournaments.bracketSF', 'Semi-Final');
            if (fromEnd === 2) return I18n.t('tournaments.bracketQF', 'Quarter-Final');
            if (fromEnd === 3) return I18n.t('tournaments.bracketR16', 'Round of 16');
            return `Round ${idx + 1}`;
        };

        const renderTeam = (name, logo, color, score, isWinner) => `
            <div style="
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: ${isWinner ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.03)'};
                border-left: 3px solid ${isWinner ? '#2ecc71' : 'transparent'};
            ">
                <div style="
                    width: 28px; height: 28px;
                    background: ${color || '#555'};
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    font-weight: bold; font-size: 11px; color: white; flex-shrink: 0;
                ">${logo || '?'}</div>
                <span style="color: ${name ? 'white' : '#666'}; font-weight: 600; flex: 1; font-size: 14px;">
                    ${name ? UI.escapeHtml(name) : 'TBD'}
                </span>
                ${score !== null && score !== undefined ? `<span style="color: #2ecc71; font-weight: bold; font-size: 16px;">${score}</span>` : ''}
            </div>
        `;

        const renderMatch = (match) => {
            const isFinished = match.status === 'finished';
            const t1wins = isFinished && match.team1_score > match.team2_score;
            const t2wins = isFinished && match.team2_score > match.team1_score;
            return `
                <div style="
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    overflow: hidden;
                    margin-bottom: 8px;
                ">
                    ${renderTeam(match.team1_name, match.team1_logo, match.team1_color, isFinished ? match.team1_score : null, t1wins)}
                    <div style="height: 1px; background: rgba(255,255,255,0.08);"></div>
                    ${renderTeam(match.team2_name, match.team2_logo, match.team2_color, isFinished ? match.team2_score : null, t2wins)}
                </div>
            `;
        };

        table.innerHTML = `
            <div style="display: flex; gap: 16px; overflow-x: auto; padding-bottom: 8px;">
                ${sortedRounds.map((r, idx) => {
                    const roundMatches = rounds[r].sort((a, b) => (a.bracket_slot || 0) - (b.bracket_slot || 0));
                    const label = getRoundLabel(idx, totalRounds);
                    return `
                        <div style="flex: 1; min-width: 220px;">
                            <h4 style="color: #2ecc71; text-align: center; margin-bottom: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                                ${label}
                            </h4>
                            <div style="display: flex; flex-direction: column; justify-content: space-around; height: calc(100% - 40px);">
                                ${roundMatches.map(m => renderMatch(m)).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.style.display = 'block';
        noStandings.style.display = 'none';
    },

    // ── Group+Playoff Standings ───────────────────────────────────────────────

    renderGroupPlayoffStandings(standings, matches) {
        const container = document.getElementById('tournament-standings-container');
        const table = document.getElementById('tournament-standings-table');
        const noStandings = document.getElementById('tournament-no-standings');

        // Separate group and playoff matches
        const groupMatches = matches.filter(m => String(m.round).startsWith('Group'));
        const playoffMatches = matches.filter(m => !String(m.round).startsWith('Group'));

        // Determine groups
        const groupLetters = [...new Set(groupMatches.map(m => m.round.replace('Group ', '')))].sort();

        let html = '';

        // Render each group standings table
        groupLetters.forEach(gl => {
            // Get teams in this group
            const gTeamIds = new Set();
            groupMatches.filter(m => m.round === `Group ${gl}`).forEach(m => {
                if (m.team1_id) gTeamIds.add(m.team1_id);
                if (m.team2_id) gTeamIds.add(m.team2_id);
            });

            const groupStandings = standings.filter(s => gTeamIds.has(s.team_id));

            if (groupStandings.length === 0) return;

            html += `
                <div style="margin-bottom: 24px;">
                    <h4 style="color: #2ecc71; margin-bottom: 12px;">Group ${gl}</h4>
                    <table style="width: 100%; border-collapse: collapse; color: white; font-size: 13px;">
                        <thead>
                            <tr style="background: rgba(46,204,113,0.15);">
                                <th style="padding: 8px; text-align: left;">#</th>
                                <th style="padding: 8px; text-align: left;">${I18n.t('stats.team')}</th>
                                <th style="padding: 8px; text-align: center;">P</th>
                                <th style="padding: 8px; text-align: center;">W</th>
                                <th style="padding: 8px; text-align: center;">D</th>
                                <th style="padding: 8px; text-align: center;">L</th>
                                <th style="padding: 8px; text-align: center;">GF</th>
                                <th style="padding: 8px; text-align: center;">GA</th>
                                <th style="padding: 8px; text-align: center;">GD</th>
                                <th style="padding: 8px; text-align: center; font-weight: bold;">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${groupStandings.map((team, i) => `
                                <tr style="background: ${i < 2 ? 'rgba(46,204,113,0.05)' : 'transparent'}; border-left: ${i < 2 ? '3px solid #2ecc71' : '3px solid transparent'};">
                                    <td style="padding: 8px;">${i + 1}</td>
                                    <td style="padding: 8px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <div style="width:24px;height:24px;background:${team.team_color||'#2ecc71'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;">
                                                ${UI.escapeHtml(team.team_logo || team.team_name.substring(0,3).toUpperCase())}
                                            </div>
                                            <span>${UI.escapeHtml(team.team_name)}</span>
                                            ${i < 2 ? '<span style="color:#2ecc71;font-size:11px;margin-left:4px;">✓</span>' : ''}
                                        </div>
                                    </td>
                                    <td style="padding:8px;text-align:center;">${team.played}</td>
                                    <td style="padding:8px;text-align:center;color:#2ecc71;">${team.won}</td>
                                    <td style="padding:8px;text-align:center;color:#f39c12;">${team.drawn}</td>
                                    <td style="padding:8px;text-align:center;color:#e74c3c;">${team.lost}</td>
                                    <td style="padding:8px;text-align:center;">${team.goals_for}</td>
                                    <td style="padding:8px;text-align:center;">${team.goals_against}</td>
                                    <td style="padding:8px;text-align:center;color:${team.goal_difference>=0?'#2ecc71':'#e74c3c'};">${team.goal_difference>0?'+':''}${team.goal_difference}</td>
                                    <td style="padding:8px;text-align:center;font-weight:bold;color:#2ecc71;">${team.points}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <p style="color:#b0b0b0;font-size:12px;margin-top:6px;">✓ Top 2 advance to playoff</p>
                </div>
            `;
        });

        // If playoff matches exist and have teams, show playoff bracket too
        const playoffWithTeams = playoffMatches.filter(m => m.team1_id || m.team2_id);
        if (playoffWithTeams.length > 0) {
            html += `<div style="margin-top: 8px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.1);">
                <h4 style="color: #2ecc71; margin-bottom: 16px; text-align: center;">
                    <i class="fas fa-trophy"></i> Playoff Stage
                </h4>
            </div>`;
            table.innerHTML = html;
            // Temporarily swap matches to render bracket inline
            const savedMatches = this._bracketMatchesOverride;
            this._bracketMatchesOverride = playoffMatches;
            const bracketHTML = this._buildBracketHTML(playoffMatches);
            table.innerHTML = html + bracketHTML;
            this._bracketMatchesOverride = savedMatches;
        } else {
            table.innerHTML = html;
        }

        container.style.display = 'block';
        noStandings.style.display = 'none';
    },

    _buildBracketHTML(matches) {
        const rounds = {};
        matches.forEach(m => {
            if (!rounds[m.round]) rounds[m.round] = [];
            rounds[m.round].push(m);
        });

        const playoffRoundOrder = ['R16', 'QF', 'SF', 'Final'];
        const sortedRounds = Object.keys(rounds).sort((a, b) => {
            const ai = playoffRoundOrder.indexOf(a);
            const bi = playoffRoundOrder.indexOf(b);
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
        });

        const renderTeam = (name, logo, color, score, isWinner) => `
            <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:${isWinner?'rgba(46,204,113,0.15)':'rgba(255,255,255,0.03)'};border-left:3px solid ${isWinner?'#2ecc71':'transparent'};">
                <div style="width:24px;height:24px;background:${color||'#555'};border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:10px;color:white;flex-shrink:0;">${logo||'?'}</div>
                <span style="color:${name?'white':'#666'};font-weight:600;flex:1;font-size:13px;">${name?UI.escapeHtml(name):'TBD'}</span>
                ${score!==null&&score!==undefined?`<span style="color:#2ecc71;font-weight:bold;">${score}</span>`:''}
            </div>
        `;

        return `<div style="display:flex;gap:16px;overflow-x:auto;padding-bottom:8px;">
            ${sortedRounds.map(r => {
                const rMatches = rounds[r].sort((a,b)=>(a.bracket_slot||0)-(b.bracket_slot||0));
                return `
                    <div style="flex:1;min-width:200px;">
                        <h5 style="color:#2ecc71;text-align:center;margin-bottom:12px;font-size:13px;text-transform:uppercase;">${r}</h5>
                        ${rMatches.map(m => {
                            const fin = m.status==='finished';
                            const t1w = fin && m.team1_score > m.team2_score;
                            const t2w = fin && m.team2_score > m.team1_score;
                            return `<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:8px;overflow:hidden;margin-bottom:8px;">
                                ${renderTeam(m.team1_name,m.team1_logo,m.team1_color,fin?m.team1_score:null,t1w)}
                                <div style="height:1px;background:rgba(255,255,255,0.08);"></div>
                                ${renderTeam(m.team2_name,m.team2_logo,m.team2_color,fin?m.team2_score:null,t2w)}
                            </div>`;
                        }).join('')}
                    </div>
                `;
            }).join('')}
        </div>`;
    },

    renderStandingsFromData(standings) {
        const container = document.getElementById('tournament-standings-container');
        const table = document.getElementById('tournament-standings-table');
        const noStandings = document.getElementById('tournament-no-standings');

        if (!standings || standings.length === 0) {
            container.style.display = 'none';
            noStandings.style.display = 'flex';
            return;
        }

        table.innerHTML = `
            <table style="width: 100%; border-collapse: collapse; color: white;">
                <thead>
                    <tr style="background: rgba(46, 204, 113, 0.2); text-align: left;">
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1);">#</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1);">${I18n.t('stats.team')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.played')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.won')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.drawn')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.lost')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalsFor')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalsAgainst')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center;">${I18n.t('stats.goalDifference')}</th>
                        <th style="padding: 12px; border-bottom: 2px solid rgba(255,255,255,0.1); text-align: center; font-weight: bold;">${I18n.t('stats.points')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${standings.map((team, index) => `
                        <tr style="background: ${index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};">
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">${index + 1}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <div style="
                                        width: 30px;
                                        height: 30px;
                                        background: ${team.team_color || '#2ecc71'};
                                        border-radius: 50%;
                                        display: flex;
                                        align-items: center;
                                        justify-content: center;
                                        font-weight: bold;
                                        font-size: 12px;
                                    ">${UI.escapeHtml(team.team_logo || team.team_name.replace(/\s+/g, '').substring(0, 3).toUpperCase())}</div>
                                    <span>${UI.escapeHtml(team.team_name)}</span>
                                </div>
                            </td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.played}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #2ecc71;">${team.won}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #f39c12;">${team.drawn}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: #e74c3c;">${team.lost}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.goals_for}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center;">${team.goals_against}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; color: ${team.goal_difference >= 0 ? '#2ecc71' : '#e74c3c'};">${team.goal_difference > 0 ? '+' : ''}${team.goal_difference}</td>
                            <td style="padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); text-align: center; font-weight: bold; color: #2ecc71; font-size: 16px;">${team.points}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.style.display = 'block';
        noStandings.style.display = 'none';
    },

    async loadStatistics(tournamentId) {
        const container = document.getElementById('tournament-statistics-container');
        const list = document.getElementById('tournament-statistics-list');
        const noStats = document.getElementById('tournament-no-statistics');

        try {
            const response = await API.getPlayerStatistics(tournamentId);
            const statistics = response.statistics || [];

            if (statistics.length === 0) {
                container.style.display = 'none';
                noStats.style.display = 'flex';
                return;
            }

            this.renderStatisticsFromData(statistics);

        } catch (error) {
            console.error('Failed to load statistics:', error);
            container.style.display = 'none';
            noStats.style.display = 'flex';
        }
    },

    renderStatisticsFromData(statistics) {
        const container = document.getElementById('tournament-statistics-container');
        const list = document.getElementById('tournament-statistics-list');
        const noStats = document.getElementById('tournament-no-statistics');

        if (!statistics || statistics.length === 0) {
            container.style.display = 'none';
            noStats.style.display = 'flex';
            return;
        }

        const topScorers = statistics.filter(s => s.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5);
        const topAssists = statistics.filter(s => s.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 5);
        const yellowPlayers = statistics.filter(s => s.yellow_cards > 0).sort((a, b) => b.yellow_cards - a.yellow_cards).slice(0, 5);
        const redPlayers = statistics.filter(s => s.red_cards > 0).sort((a, b) => b.red_cards - a.red_cards).slice(0, 5);

        const renderRankingList = (players, valueKey, iconClass) => {
            if (players.length === 0) return `<p class="statistics-empty">${I18n.t('statistics.noData')}</p>`;
            return `
                <ul class="statistics-ranking">
                    ${players.map((player, index) => `
                        <li class="ranking-item">
                            <span class="ranking-position">${index + 1}</span>
                            <div class="ranking-info">
                                <span class="ranking-name">${UI.escapeHtml(player.player_name)}</span>
                                <span class="ranking-team">${UI.escapeHtml(player.team_name || '')}</span>
                            </div>
                            <span class="ranking-value">${player[valueKey]} <i class="${iconClass}"></i></span>
                        </li>
                    `).join('')}
                </ul>`;
        };

        list.innerHTML = `
            <div class="statistics-lists">
                <div class="statistics-list-card">
                    <h3><i class="fas fa-futbol"></i> ${I18n.t('stats.topScorers')}</h3>
                    ${renderRankingList(topScorers, 'goals', 'fas fa-futbol')}
                </div>
                <div class="statistics-list-card">
                    <h3><i class="fas fa-hands-helping"></i> ${I18n.t('statistics.topAssists') || 'Top Assists'}</h3>
                    ${renderRankingList(topAssists, 'assists', 'fas fa-hands-helping')}
                </div>
            </div>
            <div class="statistics-lists" style="margin-top:20px;">
                <div class="statistics-list-card">
                    <h3 style="border-color:rgba(241,196,15,0.3);"><i class="fas fa-square" style="color:#F1C40F;"></i> ${I18n.t('stats.yellowCards')}</h3>
                    ${renderRankingList(yellowPlayers, 'yellow_cards', 'fas fa-square')}
                </div>
                <div class="statistics-list-card">
                    <h3 style="border-color:rgba(231,76,60,0.3);"><i class="fas fa-square" style="color:#e74c3c;"></i> ${I18n.t('stats.redCards')}</h3>
                    ${renderRankingList(redPlayers, 'red_cards', 'fas fa-square')}
                </div>
            </div>
        `;

        container.style.display = 'block';
        noStats.style.display = 'none';
    },

    closeDetailsModal() {
        // Leave WebSocket room
        if (this.currentTournament && window.WebSocketManager) {
            WebSocketManager.leaveTournament(this.currentTournament.id);
        }
        UI.closeModal('tournament-details-modal');
    },

    closeFixturesSettingsModal() {
        UI.closeModal('fixtures-settings-modal');
        document.getElementById('fixtures-settings-form').reset();
    },

    closeMatchResultsModal() {
        UI.closeModal('match-results-modal');
        this.currentMatch = null;
    },

    async updateJoinButton(tournament) {
        const joinBtn = document.getElementById('join-tournament-btn');
        const leaveBtn = document.getElementById('leave-tournament-btn');
        const joinStatus = document.getElementById('join-tournament-status');
        const joinStatusText = document.getElementById('join-status-text');

        joinBtn.style.display = 'none';
        joinBtn.disabled = false;
        joinBtn.innerHTML = `<i class="fas fa-plus-circle"></i> <span data-i18n="tournaments.joinTournament">${I18n.t('tournaments.joinTournament', 'Join Tournament')}</span>`;
        leaveBtn.style.display = 'none';
        leaveBtn.disabled = false;
        leaveBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> <span data-i18n="tournaments.leaveTournament">${I18n.t('tournaments.leaveTournament', 'Leave Tournament')}</span>`;
        joinStatus.style.display = 'none';

        if (!API.isAuthenticated()) return;

        const user = API.getUser();
        if (user.role !== 'coach') return;

        try {
            const response = await API.checkTournamentJoined(tournament.id);

            if (response.joined) {
                // Approved: can leave if fixtures not yet generated
                const matchesResp = await API.getTournamentMatches(tournament.id);
                const hasFixtures = matchesResp.matches && matchesResp.matches.length > 0;
                if (tournament.status === 'upcoming' && !hasFixtures) {
                    leaveBtn.style.display = 'inline-flex';
                    leaveBtn.onclick = () => this.handleLeaveTournament(tournament.id);
                }
                joinStatusText.textContent = I18n.t('tournaments.teamParticipating');
                joinStatus.style.color = '#2ecc71';
                joinStatus.querySelector('i').className = 'fas fa-check-circle';
                joinStatus.style.display = 'block';
                return;
            }


            if (!response.hasTeam) {
                joinStatusText.textContent = I18n.t('tournaments.needTeamFirst');
                joinStatus.style.color = '#f39c12';
                joinStatus.querySelector('i').className = 'fas fa-exclamation-triangle';
                joinStatus.style.display = 'block';
                return;
            }

        } catch (error) {
            console.error('Check join error:', error);
        }

        // Can join if tournament is upcoming, not full, and no fixtures yet
        if (tournament.status !== 'upcoming') return;

        // Check if fixtures already generated (block join after that)
        try {
            const matchesResp = await API.getTournamentMatches(tournament.id);
            if (matchesResp.matches && matchesResp.matches.length > 0) {
                joinStatusText.textContent = I18n.t('tournaments.registrationClosed', 'Registration closed');
                joinStatus.style.color = '#e74c3c';
                joinStatus.querySelector('i').className = 'fas fa-lock';
                joinStatus.style.display = 'block';
                return;
            }
        } catch (e) { /* ignore */ }

        const currentTeams = tournament.teams_count || 0;
        const maxTeams = tournament.max_teams;

        if (currentTeams < maxTeams) {
            joinBtn.style.display = 'inline-flex';
            joinBtn.onclick = () => this.handleJoinTournament(tournament.id);
        } else {
            joinStatusText.textContent = I18n.t('tournaments.tournamentFull');
            joinStatus.style.color = '#e74c3c';
            joinStatus.querySelector('i').className = 'fas fa-times-circle';
            joinStatus.style.display = 'block';
        }
    },

    async updateGenerateFixturesButton(tournament) {
        const generateBtn = document.getElementById('generate-fixtures-btn');

        if (!generateBtn) return;

        generateBtn.style.display = 'none';

        if (!API.isAuthenticated()) return;

        const user = API.getUser();

        if (user.role !== 'organizer') return;
        if (tournament.organizer_id !== user.id) return;
        if (tournament.status !== 'upcoming') return;

        // Hide if fixtures already generated
        try {
            const matchesResp = await API.getTournamentMatches(tournament.id);
            if (matchesResp.matches && matchesResp.matches.length > 0) return;
        } catch (e) { /* ignore */ }

        generateBtn.style.display = 'inline-flex';
        generateBtn.onclick = () => this.openGenerateFixturesModal(tournament);
    },

    async handleJoinTournament(tournamentId) {
        const joinBtn = document.getElementById('join-tournament-btn');

        joinBtn.disabled = true;
        const originalHTML = joinBtn.innerHTML;
        joinBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            await API.joinTournament(tournamentId);

            UI.showNotification(I18n.t('tournaments.joinSuccess'), 'success');

            this.closeDetailsModal();
            await this.load();
            if (window.Statistics) Statistics.load();
            if (window.Teams) Teams.load();
            if (window.Auth) Auth.updateProfileStats(API.getUser());

        } catch (error) {
            console.error('Join error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.joinFailed'), 'error');

            joinBtn.innerHTML = originalHTML;
            joinBtn.disabled = false;
        }
    },

    async handleLeaveTournament(tournamentId) {
        const leaveBtn = document.getElementById('leave-tournament-btn');

        leaveBtn.disabled = true;
        const originalHTML = leaveBtn.innerHTML;
        leaveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        try {
            await API.request(`/tournaments/${tournamentId}/leave`, { method: 'POST' });

            UI.showNotification(I18n.t('tournaments.leaveSuccess') || 'Left tournament', 'success');

            this.closeDetailsModal();
            await this.load();
            if (window.Statistics) Statistics.load();
            if (window.Teams) Teams.load();
            if (window.Auth) Auth.updateProfileStats(API.getUser());

        } catch (error) {
            console.error('Leave error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.leaveFailed'), 'error');

            leaveBtn.innerHTML = originalHTML;
            leaveBtn.disabled = false;
        }
    },

    async openTournamentById(tournamentId) {
        try {
            const response = await API.request(`/tournaments`);
            const tournament = (response.tournaments || []).find(t => t.id == tournamentId);
            if (tournament) {
                UI.showSection('tournaments');
                await this.load();
                this.openDetailsModal(tournament);
            }
        } catch (e) {
            console.error('openTournamentById error:', e);
        }
    },

    openGenerateFixturesModal(tournament) {
        this.currentTournament = tournament;
        this.closeDetailsModal();
        UI.openModal('fixtures-settings-modal');
    },

    updateEstimatedEndDate() {
        const startDateVal = document.getElementById('fixtures-start-date').value;
        const matchesPerDay = parseInt(document.getElementById('fixtures-matches-per-day').value) || 2;
        const matchDays = Array.from(document.querySelectorAll('input[name="match-days"]:checked')).map(cb => parseInt(cb.value));
        const block = document.getElementById('estimated-end-date-block');
        const valueEl = document.getElementById('estimated-end-date-value');

        if (!startDateVal || matchDays.length === 0 || !this.currentTournament) {
            block.style.display = 'none';
            return;
        }

        // Calculate total matches needed
        const teams = this.currentTournament.max_teams;
        const type = this.currentTournament.type;
        let totalMatches = 0;
        if (type === 'league') {
            totalMatches = (teams * (teams - 1)) / 2;
        } else if (type === 'playoff') {
            totalMatches = teams - 1;
        } else {
            const groups = teams <= 8 ? 2 : 4;
            const teamsPerGroup = teams / groups;
            const groupMatches = groups * (teamsPerGroup * (teamsPerGroup - 1)) / 2;
            const playoffTeams = groups * 2;
            totalMatches = groupMatches + (playoffTeams - 1);
        }

        // Calculate days needed
        const matchDaysPerWeek = matchDays.length;
        const totalMatchDays = Math.ceil(totalMatches / matchesPerDay);
        const weeks = Math.floor(totalMatchDays / matchDaysPerWeek);
        const extraDays = totalMatchDays % matchDaysPerWeek;
        const totalDays = weeks * 7 + (extraDays > 0 ? Math.ceil(extraDays * 7 / matchDaysPerWeek) : 0) + (type !== 'league' ? 3 : 0);

        const endDate = new Date(startDateVal);
        endDate.setDate(endDate.getDate() + totalDays);

        valueEl.textContent = UI.formatDate(endDate.toISOString());
        block.style.display = 'block';
    },

    async handleGenerateFixtures(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);

        try {
            const matchDays = Array.from(document.querySelectorAll('input[name="match-days"]:checked'))
                .map(cb => parseInt(cb.value));

            if (matchDays.length === 0) {
                throw new Error(I18n.t('fixturesSettings.selectAtLeastOneDay'));
            }

            const data = {
                startDate: document.getElementById('fixtures-start-date').value,
                matchTime: document.getElementById('fixtures-match-time').value,
                matchDays: matchDays,
                matchesPerDay: parseInt(document.getElementById('fixtures-matches-per-day').value),
                daysBetweenRounds: 0
            };

            await API.request(`/tournaments/${this.currentTournament.id}/fixtures/generate`, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            UI.showNotification(I18n.t('messages.success.fixturesGenerated'), 'success');
            this.closeFixturesSettingsModal();
            await this.load();
            if (window.Matches) Matches.load();
            if (window.Statistics) Statistics.load();

        } catch (error) {
            console.error('Generate fixtures error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.generateFixturesFailed'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async loadTournamentFixtures(tournamentId) {
        const fixturesContainer = document.getElementById('tournament-fixtures-container');
        const fixturesList = document.getElementById('tournament-fixtures-list');
        const noFixtures = document.getElementById('tournament-no-fixtures');

        try {
            const response = await API.getTournamentMatches(tournamentId);
            const matches = response.matches || [];

            if (matches.length === 0) {
                fixturesContainer.style.display = 'none';
                noFixtures.style.display = 'flex';
                return;
            }

            const rounds = {};
            matches.forEach(match => {
                if (!rounds[match.round]) {
                    rounds[match.round] = [];
                }
                rounds[match.round].push(match);
            });

            fixturesList.innerHTML = '';

            const type = this.currentTournament ? this.currentTournament.type : 'league';
            const totalRounds = Object.keys(rounds).length;

            // Sort rounds: groups first (alphabetically), then playoff in order
            const playoffOrder = ['R16', 'QF', 'SF', 'Final'];
            const sortedRoundKeys = Object.keys(rounds).sort((a, b) => {
                const aIsGroup = String(a).startsWith('Group');
                const bIsGroup = String(b).startsWith('Group');
                if (aIsGroup && bIsGroup) return String(a).localeCompare(String(b));
                if (aIsGroup) return -1;
                if (bIsGroup) return 1;
                // Both are playoff or numeric rounds
                const aIdx = playoffOrder.indexOf(a);
                const bIdx = playoffOrder.indexOf(b);
                if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
                return parseInt(a) - parseInt(b);
            });

            sortedRoundKeys.forEach((roundNum, idx) => {
                const roundMatches = rounds[roundNum].sort((a, b) => (a.bracket_slot || 0) - (b.bracket_slot || 0));

                // Determine label
                let label;
                if (String(roundNum).startsWith('Group') || playoffOrder.includes(roundNum)) {
                    label = roundNum; // Already named: "Group A", "QF", "SF", "Final"
                } else if (type === 'playoff') {
                    // For numeric playoff rounds, translate to QF/SF/Final
                    const numericRounds = sortedRoundKeys.filter(r => !isNaN(parseInt(r)));
                    const totalNumeric = numericRounds.length;
                    const myIdx = numericRounds.indexOf(String(roundNum));
                    const fromEnd = totalNumeric - 1 - myIdx;
                    if (fromEnd === 0) label = I18n.t('tournaments.bracketFinal', 'Final');
                    else if (fromEnd === 1) label = I18n.t('tournaments.bracketSF', 'Semi-Final');
                    else if (fromEnd === 2) label = I18n.t('tournaments.bracketQF', 'Quarter-Final');
                    else if (fromEnd === 3) label = I18n.t('tournaments.bracketR16', 'Round of 16');
                    else label = I18n.t('tournaments.round', { num: roundNum });
                } else {
                    label = I18n.t('tournaments.round', { num: roundNum });
                }

                const roundDiv = document.createElement('div');
                roundDiv.style.marginBottom = '24px';

                roundDiv.innerHTML = `
                    <h4 style="color: #2ecc71; margin-bottom: 12px;">${label}</h4>
                    <div style="display: grid; gap: 12px;">
                        ${roundMatches.map(match => this.createFixtureCard(match, tournamentId)).join('')}
                    </div>
                `;

                fixturesList.appendChild(roundDiv);
            });

            fixturesContainer.style.display = 'block';
            noFixtures.style.display = 'none';

        } catch (error) {
            console.error('Failed to load fixtures:', error);
            fixturesContainer.style.display = 'none';
            noFixtures.style.display = 'flex';
        }
    },

    createFixtureCard(match, tournamentId) {
        const dateStr = I18n.formatDate(match.match_date);
        const timeStr = I18n.formatTime(match.match_date);

        const user = API.getUser();
        const isOrganizer = user && user.role === 'organizer' && match.organizer_id === user.id;

        const team1Name = match.team1_name || 'TBD';
        const team2Name = match.team2_name || 'TBD';
        const team1Logo = match.team1_logo || (match.team1_name ? '' : '?');
        const team2Logo = match.team2_logo || (match.team2_name ? '' : '?');
        const isTBD = !match.team1_id || !match.team2_id;
        const matchTime = match.match_date ? new Date(match.match_date) : null;
        const matchStarted = matchTime ? new Date() >= matchTime : false;

        return `
            <div data-match-id="${match.id}" style="
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                padding: 16px;
                ${isTBD ? 'opacity: 0.6;' : ''}
            ">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="flex: 1; display: flex; align-items: center; gap: 12px;">
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: ${match.team1_color || '#2ecc71'};
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            color: white;
                            font-size: 14px;
                        ">
                            ${team1Logo}
                        </div>
                        <span style="color: white; font-weight: 600;">${team1Name}</span>
                    </div>

                    <div style="text-align: center; padding: 0 24px;">
                        ${match.status === 'finished' ? `
                            <div class="match-score" style="color: #2ecc71; font-weight: bold; font-size: 24px;">
                                ${match.team1_score} - ${match.team2_score}
                            </div>
                        ` : `
                            <div class="match-score" style="color: #2ecc71; font-weight: bold; font-size: 18px;">${I18n.t('common.vs')}</div>
                        `}
                        <div style="color: #b0b0b0; font-size: 12px; margin-top: 4px;">${dateStr}</div>
                        <div style="color: #b0b0b0; font-size: 12px;">${timeStr}</div>
                    </div>

                    <div style="flex: 1; display: flex; align-items: center; gap: 12px; justify-content: flex-end;">
                        <span style="color: white; font-weight: 600;">${team2Name}</span>
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: ${match.team2_color || '#e74c3c'};
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-weight: bold;
                            color: white;
                            font-size: 14px;
                        ">
                            ${team2Logo}
                        </div>
                    </div>
                </div>

                ${isOrganizer && match.status !== 'finished' && !isTBD ? `
                    <div style="margin-top: 16px; text-align: center;">
                        <button
                            class="btn btn-primary btn-sm"
                            onclick="Tournaments.openMatchResultsModal(${tournamentId}, ${match.id}); event.stopPropagation();"
                            ${!matchStarted ? 'disabled title="Match has not started yet"' : ''}
                            style="${!matchStarted ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
                        >
                            <i class="fas fa-edit"></i> ${matchStarted ? I18n.t('match.enterResults') : I18n.t('match.notStartedYet', 'Not started yet')}
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    },

    async openMatchResultsModal(tournamentId, matchId) {
        try {
            const response = await API.getMatchDetails(tournamentId, matchId);
            this.currentMatch = response.match;

            // Reset finish button state
            const finishBtn = document.getElementById('finish-match-btn');
            if (finishBtn) {
                finishBtn.disabled = false;
                finishBtn.innerHTML = `<i class="fas fa-flag-checkered"></i> <span data-i18n="match.finishMatch">${I18n.t('match.finishMatch', 'Finish Match')}</span>`;
            }

            // Team 1
            document.getElementById('match-team1-logo').textContent = this.currentMatch.team1_logo || '';
            document.getElementById('match-team1-logo').style.color = this.currentMatch.team1_color || '#2ecc71';
            document.getElementById('match-team1-name').textContent = this.currentMatch.team1_name;

            // Team 2
            document.getElementById('match-team2-logo').textContent = this.currentMatch.team2_logo || '';
            document.getElementById('match-team2-logo').style.color = this.currentMatch.team2_color || '#e74c3c';
            document.getElementById('match-team2-name').textContent = this.currentMatch.team2_name;

            // Score
            this.updateScoreDisplay();

            // Show/hide management forms based on match status and user role
            const user = API.getUser();
            const isOrganizer = user && user.role === 'organizer';
            const isFinished = this.currentMatch.status === 'finished';
            const formsContainer = document.getElementById('match-management-forms');

            if (isOrganizer && !isFinished) {
                formsContainer.style.display = 'block';
                this.populateTeamDropdowns();
            } else {
                formsContainer.style.display = 'none';
            }

            // Match status display
            const statusDisplay = document.getElementById('match-status-display');
            if (isFinished) {
                statusDisplay.textContent = I18n.t('matches.finished') || 'Finished';
                statusDisplay.style.color = '#b0b0b0';
            } else {
                statusDisplay.textContent = I18n.t('matches.upcoming') || 'Upcoming';
                statusDisplay.style.color = '#2ecc71';
            }

            this.loadMatchEvents();

            this.closeDetailsModal();
            UI.openModal('match-results-modal');

        } catch (error) {
            console.error('Failed to open match results:', error);
            UI.showNotification(I18n.t('messages.error.loadMatchDetails'), 'error');
        }
    },

    updateScoreDisplay() {
        if (!this.currentMatch) return;
        const scoreDisplay = document.getElementById('match-score-display');
        scoreDisplay.textContent = `${this.currentMatch.team1_score || 0} - ${this.currentMatch.team2_score || 0}`;
    },

    populateTeamDropdowns() {
        if (!this.currentMatch) return;

        const team1Name = this.currentMatch.team1_name;
        const team2Name = this.currentMatch.team2_name;
        const team1Id = this.currentMatch.team1_id;
        const team2Id = this.currentMatch.team2_id;

        // Goal team dropdown
        const goalTeam = document.getElementById('goal-team');
        goalTeam.innerHTML = `
            <option value="">${I18n.t('match.selectTeam')}</option>
            <option value="${team1Id}">${team1Name}</option>
            <option value="${team2Id}">${team2Name}</option>
        `;

        // Card team dropdown
        const cardTeam = document.getElementById('card-team');
        cardTeam.innerHTML = `
            <option value="">${I18n.t('match.selectTeam')}</option>
            <option value="${team1Id}">${team1Name}</option>
            <option value="${team2Id}">${team2Name}</option>
        `;

        // Reset player dropdowns
        document.getElementById('goal-player').innerHTML = `<option value="">${I18n.t('match.selectPlayer')}</option>`;
        document.getElementById('goal-assist').innerHTML = `<option value="">—</option>`;
        document.getElementById('card-player').innerHTML = `<option value="">${I18n.t('match.selectPlayer')}</option>`;
    },

    getTeamPlayers(teamId) {
        if (!this.currentMatch) return [];
        if (String(teamId) === String(this.currentMatch.team1_id)) {
            return this.currentMatch.team1_players || [];
        }
        if (String(teamId) === String(this.currentMatch.team2_id)) {
            return this.currentMatch.team2_players || [];
        }
        return [];
    },

    updateGoalPlayerDropdown() {
        const teamId = document.getElementById('goal-team').value;
        const playerSelect = document.getElementById('goal-player');
        const assistSelect = document.getElementById('goal-assist');

        playerSelect.innerHTML = `<option value="">${I18n.t('match.selectPlayer')}</option>`;
        assistSelect.innerHTML = `<option value="">—</option>`;

        if (!teamId) return;

        const players = this.getTeamPlayers(teamId);
        players.forEach(p => {
            const option = document.createElement('option');
            option.value = p.player_id;
            option.textContent = `${p.jersey_number ? '#' + p.jersey_number + ' ' : ''}${p.player_name}`;
            playerSelect.appendChild(option);
        });
    },

    updateAssistDropdown() {
        const teamId = document.getElementById('goal-team').value;
        const playerId = document.getElementById('goal-player').value;
        const isOwnGoal = document.getElementById('goal-own-goal').checked;
        const assistSelect = document.getElementById('goal-assist');

        assistSelect.innerHTML = `<option value="">—</option>`;

        // No assist for own goals
        if (isOwnGoal || !teamId || !playerId) {
            assistSelect.disabled = isOwnGoal;
            return;
        }

        assistSelect.disabled = false;
        const players = this.getTeamPlayers(teamId);
        players.forEach(p => {
            if (String(p.player_id) === String(playerId)) return; // exclude scorer
            const option = document.createElement('option');
            option.value = p.player_id;
            option.textContent = `${p.jersey_number ? '#' + p.jersey_number + ' ' : ''}${p.player_name}`;
            assistSelect.appendChild(option);
        });
    },

    updateCardPlayerDropdown() {
        const teamId = document.getElementById('card-team').value;
        const playerSelect = document.getElementById('card-player');

        playerSelect.innerHTML = `<option value="">${I18n.t('match.selectPlayer')}</option>`;

        if (!teamId) return;

        const players = this.getTeamPlayers(teamId);
        players.forEach(p => {
            const option = document.createElement('option');
            option.value = p.player_id;
            option.textContent = `${p.jersey_number ? '#' + p.jersey_number + ' ' : ''}${p.player_name}`;
            playerSelect.appendChild(option);
        });
    },

    loadMatchEvents() {
        const eventsList = document.getElementById('match-events-list');

        if (!this.currentMatch || !this.currentMatch.events || this.currentMatch.events.length === 0) {
            eventsList.innerHTML = `<p style="color: #b0b0b0; text-align: center;">${I18n.t('match.noEvents')}</p>`;
            return;
        }

        const user = API.getUser();
        const isOrganizer = user && user.role === 'organizer';
        const isFinished = this.currentMatch.status === 'finished';

        eventsList.innerHTML = this.currentMatch.events.map(event => {
            const iconMap = {
                'goal': 'fa-futbol',
                'yellow_card': 'fa-square',
                'red_card': 'fa-square',
                'substitution': 'fa-exchange-alt'
            };

            const colorMap = {
                'goal': '#2ecc71',
                'yellow_card': '#f39c12',
                'red_card': '#e74c3c',
                'substitution': '#3498db'
            };

            const ownGoalLabel = event.is_own_goal ? ` <span style="color: #e74c3c; font-size: 12px;">(OG)</span>` : '';
            const assistLabel = event.assist_player_name ? `<div style="color: #3498db; font-size: 12px;">${I18n.t('match.assist') || 'Assist'}: ${UI.escapeHtml(event.assist_player_name)}</div>` : '';

            const deleteBtn = isOrganizer && !isFinished && event.id ? `
                <button
                    onclick="Tournaments.handleDeleteEvent(${event.id}); event.stopPropagation();"
                    style="
                        background: none;
                        border: 1px solid rgba(231, 76, 60, 0.5);
                        color: #e74c3c;
                        border-radius: 50%;
                        width: 28px;
                        height: 28px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        font-size: 12px;
                        margin-left: 8px;
                    "
                    title="${I18n.t('common.delete') || 'Delete'}"
                >
                    <i class="fas fa-times"></i>
                </button>
            ` : '';

            return `
                <div style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    margin-bottom: 8px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 8px;
                ">
                    <div style="
                        width: 40px;
                        height: 40px;
                        background: ${colorMap[event.event_type] || '#666'};
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        flex-shrink: 0;
                    ">
                        <i class="fas ${iconMap[event.event_type] || 'fa-circle'}"></i>
                    </div>
                    <div style="flex: 1;">
                        <div style="color: white; font-weight: 600;">${UI.escapeHtml(event.player_name)}${ownGoalLabel}</div>
                        <div style="color: #b0b0b0; font-size: 14px;">${UI.escapeHtml(event.team_name)}</div>
                        ${assistLabel}
                    </div>
                    <div style="text-align: right; display: flex; align-items: center;">
                        <div>
                            <div style="color: #2ecc71; font-weight: bold; font-size: 18px;">${event.minute}'</div>
                            <div style="color: #b0b0b0; font-size: 12px; text-transform: capitalize;">
                                ${event.event_type.replace('_', ' ')}
                            </div>
                        </div>
                        ${deleteBtn}
                    </div>
                </div>
            `;
        }).join('');
    },

    async handleAddGoal(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);

        try {
            const teamId = parseInt(document.getElementById('goal-team').value);
            const playerId = parseInt(document.getElementById('goal-player').value);
            const minute = parseInt(document.getElementById('goal-minute').value);
            const isOwnGoal = document.getElementById('goal-own-goal').checked;
            const assistPlayerId = document.getElementById('goal-assist').value ? parseInt(document.getElementById('goal-assist').value) : null;

            if (!teamId || !playerId) {
                throw new Error(I18n.t('messages.error.teamAndPlayerRequired'));
            }

            const eventData = {
                teamId,
                playerId,
                eventType: 'goal',
                minute,
                isOwnGoal,
                assistPlayerId: isOwnGoal ? null : assistPlayerId
            };

            await API.addMatchEvent(
                this.currentMatch.tournament_id,
                this.currentMatch.id,
                eventData
            );

            UI.showNotification(I18n.t('match.goalAdded'), 'success');

            // Reload match details to get updated score and events
            const response = await API.getMatchDetails(this.currentMatch.tournament_id, this.currentMatch.id);
            this.currentMatch = response.match;
            this.updateScoreDisplay();
            this.loadMatchEvents();

            form.reset();
            this.populateTeamDropdowns();

            if (window.Statistics) Statistics.load();
            if (window.Matches) Matches.load();

        } catch (error) {
            console.error('Add goal error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.addGoalFailed'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async handleAddCard(e) {
        e.preventDefault();

        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        UI.showButtonLoading(submitBtn);

        try {
            const teamId = parseInt(document.getElementById('card-team').value);
            const playerId = parseInt(document.getElementById('card-player').value);
            const cardType = document.getElementById('card-type').value;
            const minute = parseInt(document.getElementById('card-minute').value);

            if (!teamId || !playerId || !cardType) {
                throw new Error(I18n.t('messages.error.allFieldsRequired'));
            }

            const eventData = {
                teamId,
                playerId,
                eventType: cardType,
                minute
            };

            await API.addMatchEvent(
                this.currentMatch.tournament_id,
                this.currentMatch.id,
                eventData
            );

            UI.showNotification(I18n.t('match.cardAdded'), 'success');

            const response = await API.getMatchDetails(this.currentMatch.tournament_id, this.currentMatch.id);
            this.currentMatch = response.match;
            this.loadMatchEvents();

            form.reset();
            this.populateTeamDropdowns();

            if (window.Statistics) Statistics.load();
            if (window.Matches) Matches.load();

        } catch (error) {
            console.error('Add card error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.addCardFailed'), 'error');
        } finally {
            UI.hideButtonLoading(submitBtn);
        }
    },

    async handleDeleteEvent(eventId) {
        try {
            await API.request(
                `/tournaments/${this.currentMatch.tournament_id}/matches/${this.currentMatch.id}/events/${eventId}`,
                { method: 'DELETE' }
            );

            UI.showNotification(I18n.t('match.eventDeleted') || 'Event deleted', 'success');

            // Reload match details
            const response = await API.getMatchDetails(this.currentMatch.tournament_id, this.currentMatch.id);
            this.currentMatch = response.match;
            this.updateScoreDisplay();
            this.loadMatchEvents();

            if (window.Statistics) Statistics.load();
            if (window.Matches) Matches.load();

        } catch (error) {
            console.error('Delete event error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.deleteEventFailed'), 'error');
        }
    },

    async handleFinishMatch() {
        // Validate: number of goal events must match the score
        const team1Score = this.currentMatch.team1_score || 0;
        const team2Score = this.currentMatch.team2_score || 0;
        const events = this.currentMatch.events || [];
        const goalCount = events.filter(e => e.event_type === 'goal').length;
        const totalScore = team1Score + team2Score;

        if (goalCount !== totalScore) {
            UI.showNotification(
                `Goals entered (${goalCount}) do not match the score (${team1Score + team2Score}). Please add all goal events.`,
                'error',
                4000
            );
            return;
        }

        const finishBtn = document.getElementById('finish-match-btn');
        finishBtn.disabled = true;
        const originalHTML = finishBtn.innerHTML;
        finishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

        let success = false;
        try {
            await API.updateMatchResult(
                this.currentMatch.tournament_id,
                this.currentMatch.id,
                { status: 'finished' }
            );
            success = true;
            UI.showNotification(I18n.t('match.matchFinished') || 'Match finished', 'success');
            this.closeMatchResultsModal();
            await this.load();
            if (window.Matches) Matches.load();
            if (window.Statistics) Statistics.load();
            if (window.Auth) Auth.updateProfileStats(API.getUser());

        } catch (error) {
            console.error('Finish match error:', error);
            UI.showNotification(error.message || I18n.t('messages.error.finishMatchFailed'), 'error');
        } finally {
            if (!success) {
                finishBtn.innerHTML = originalHTML;
                finishBtn.disabled = false;
            }
        }
    },

};

window.Tournaments = Tournaments;
