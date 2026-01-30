/**
 * FIXTURES GENERATOR
 * Round-Robin tournament scheduling algorithm
 */

/**
 * Generate double round-robin fixtures
 * Each team plays every other team twice (home and away)
 *
 * @param {Array<Object>} teams - Array of team objects
 * @returns {Array<Array<Object>>} Array of rounds, each containing matches
 * @throws {Error} If less than 2 teams provided
 */
function generateRoundRobinDouble(teams) {
    const n = teams.length;

    if (n < 2) {
        throw new Error('Minimum 2 teams required');
    }

    // First leg (home matches)
    const firstLegRounds = generateSingleRound(teams);

    // Second leg (away matches - reversed)
    const secondLegRounds = firstLegRounds.map(round => {
        return round.map(match => ({
            teamA: match.teamB,
            teamB: match.teamA
        }));
    });

    return [...firstLegRounds, ...secondLegRounds];
}

/**
 * Generate single round-robin (each team plays each other once)
 * Uses Round-Robin Scheduling Algorithm
 * Each round has each team playing exactly once
 *
 * Example with 4 teams (A, B, C, D):
 * Round 1: A vs B, C vs D
 * Round 2: A vs C, B vs D
 * Round 3: A vs D, B vs C
 *
 * @param {Array<Object>} teams - Array of team objects
 * @returns {Array<Array<Object>>} Array of rounds containing matches
 */
function generateSingleRound(teams) {
    const n = teams.length;
    const rounds = [];

    // Add dummy "BYE" team if odd number of teams
    let teamList = [...teams];
    if (n % 2 !== 0) {
        teamList.push({ id: null, name: 'BYE' });
    }

    const totalTeams = teamList.length;
    const totalRounds = totalTeams - 1;
    const matchesPerRound = totalTeams / 2;

    for (let round = 0; round < totalRounds; round++) {
        const roundMatches = [];

        for (let match = 0; match < matchesPerRound; match++) {
            const home = (round + match) % (totalTeams - 1);
            const away = (totalTeams - 1 - match + round) % (totalTeams - 1);

            // Last team is always fixed
            const homeTeam = match === 0 ? teamList[totalTeams - 1] : teamList[home];
            const awayTeam = teamList[away];

            // Skip BYE matches
            if (homeTeam.id !== null && awayTeam.id !== null) {
                roundMatches.push({
                    teamA: homeTeam,
                    teamB: awayTeam
                });
            }
        }

        rounds.push(roundMatches);
    }

    return rounds;
}

/**
 * Schedule matches with dates and times
 * Each round must be on a different day
 *
 * @param {Array<Array<Object>>} rounds - Array of rounds containing matches
 * @param {Object} settings - Scheduling settings
 * @param {string} settings.startDate - Tournament start date
 * @param {Array<number>} settings.matchDays - Allowed days of week (0=Sun, 1=Mon, etc.)
 * @param {string} settings.matchTime - Match time in HH:mm format
 * @param {number} settings.matchesPerDay - Maximum matches per day
 * @param {number} settings.daysBetweenRounds - Rest days between rounds
 * @returns {Array<Object>} Array of scheduled matches
 */
function scheduleMatches(rounds, settings) {
    const {
        startDate,
        matchDays,
        matchTime,
        matchesPerDay,
        daysBetweenRounds
    } = settings;

    const scheduledMatches = [];
    let currentDate = new Date(startDate);
    let roundNumber = 1;

    for (const round of rounds) {
        let matchesScheduledInRound = 0;

        for (const match of round) {
            // Find next available match day
            while (!matchDays.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            scheduledMatches.push({
                round: roundNumber,
                teamAId: match.teamA.id,
                teamBId: match.teamB.id,
                matchDate: formatDateTime(currentDate, matchTime)
            });

            matchesScheduledInRound++;

            // If day limit reached and more matches in this round
            if (matchesScheduledInRound % matchesPerDay === 0 && matchesScheduledInRound < round.length) {
                do {
                    currentDate.setDate(currentDate.getDate() + 1);
                } while (!matchDays.includes(currentDate.getDay()));
            }
        }

        // Round completed - move to next day (mandatory)
        currentDate.setDate(currentDate.getDate() + 1);

        // Add rest days between rounds
        if (daysBetweenRounds > 0) {
            currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
        }

        roundNumber++;
    }

    return scheduledMatches;
}

/**
 * Format date and time to MySQL DATETIME format
 *
 * @param {Date} date - Date object
 * @param {string} time - Time in HH:mm format
 * @returns {string} Formatted datetime string (YYYY-MM-DD HH:mm:ss)
 */
function formatDateTime(date, time) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day} ${time}:00`;
}

/**
 * Calculate tournament end date based on schedule
 * Each round must be on a different day
 *
 * @param {Array<Array<Object>>} rounds - Array of rounds containing matches
 * @param {Object} settings - Scheduling settings
 * @param {string} settings.startDate - Tournament start date
 * @param {Array<number>} settings.matchDays - Allowed days of week
 * @param {number} settings.matchesPerDay - Maximum matches per day
 * @param {number} settings.daysBetweenRounds - Rest days between rounds
 * @returns {string} End date in YYYY-MM-DD format
 */
function calculateEndDate(rounds, settings) {
    const {
        startDate,
        matchDays,
        matchesPerDay,
        daysBetweenRounds
    } = settings;

    let currentDate = new Date(startDate);

    for (const round of rounds) {
        let matchesScheduledInRound = 0;

        for (const match of round) {
            while (!matchDays.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            matchesScheduledInRound++;

            if (matchesScheduledInRound % matchesPerDay === 0 && matchesScheduledInRound < round.length) {
                do {
                    currentDate.setDate(currentDate.getDate() + 1);
                } while (!matchDays.includes(currentDate.getDay()));
            }
        }

        // Round completed - move to next day (mandatory)
        currentDate.setDate(currentDate.getDate() + 1);

        // Add rest days between rounds
        if (daysBetweenRounds > 0) {
            currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
        }
    }

    return currentDate.toISOString().split('T')[0];
}

module.exports = {
    generateRoundRobinDouble,
    scheduleMatches,
    calculateEndDate
};