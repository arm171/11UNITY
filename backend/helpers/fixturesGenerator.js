/**
 * FIXTURES GENERATOR
 * Scheduling algorithms for League, Playoff, and Group+Playoff tournaments
 */

// ─── LEAGUE (Round-Robin) ─────────────────────────────────────────────────────

/**
 * Double round-robin: each team plays every other team twice (home + away)
 */
function generateRoundRobinDouble(teams) {
    const firstLeg = generateSingleRound(teams);
    const secondLeg = firstLeg.map(round =>
        round.map(match => ({ teamA: match.teamB, teamB: match.teamA, bracketSlot: null }))
    );
    return [...firstLeg, ...secondLeg];
}

/**
 * Single round-robin using the circle method
 */
function generateSingleRound(teams) {
    const n = teams.length;
    const rounds = [];

    let teamList = [...teams];
    if (n % 2 !== 0) teamList.push({ id: null, name: 'BYE' });

    const total = teamList.length;
    const totalRounds = total - 1;
    const matchesPerRound = total / 2;

    for (let round = 0; round < totalRounds; round++) {
        const roundMatches = [];
        for (let match = 0; match < matchesPerRound; match++) {
            const home = (round + match) % (total - 1);
            const away = (total - 1 - match + round) % (total - 1);
            const homeTeam = match === 0 ? teamList[total - 1] : teamList[home];
            const awayTeam = teamList[away];
            if (homeTeam.id !== null && awayTeam.id !== null) {
                roundMatches.push({ teamA: homeTeam, teamB: awayTeam, bracketSlot: null });
            }
        }
        rounds.push(roundMatches);
    }
    return rounds;
}

// ─── PLAYOFF (Single Elimination) ────────────────────────────────────────────

/**
 * Generate single-elimination playoff bracket.
 * Round 1 has actual teams. Later rounds have null (TBD) until winners advance.
 *
 * Bracket pairing: 1 vs 2, 3 vs 4, 5 vs 6, ... (random seeding)
 * Winner of slot S goes to: round R+1, slot ceil(S/2)
 *   - odd slot  → becomes team1
 *   - even slot → becomes team2
 */
function generatePlayoff(teams) {
    const n = teams.length;
    if (![4, 8, 16, 32].includes(n)) {
        throw new Error('Playoff requires exactly 4, 8, 16, or 32 teams');
    }

    // Random seeding
    const shuffled = [...teams].sort(() => Math.random() - 0.5);

    const allRounds = [];
    const numRounds = Math.log2(n);

    // Round 1: actual pairs
    const round1 = [];
    for (let i = 0; i < n / 2; i++) {
        round1.push({
            teamA: shuffled[i * 2],
            teamB: shuffled[i * 2 + 1],
            bracketSlot: i + 1
        });
    }
    allRounds.push(round1);

    // Rounds 2+: TBD placeholders
    let matchesInRound = n / 4;
    for (let r = 1; r < numRounds; r++) {
        const round = [];
        for (let i = 0; i < matchesInRound; i++) {
            round.push({ teamA: null, teamB: null, bracketSlot: i + 1 });
        }
        allRounds.push(round);
        matchesInRound = Math.max(1, Math.floor(matchesInRound / 2));
    }

    return allRounds;
}

// ─── GROUP + PLAYOFF ──────────────────────────────────────────────────────────

/**
 * Group stage (round-robin in groups of 4) + Knockout playoff.
 *
 * Groups: 8 teams → 2 groups, 16 → 4 groups, 32 → 8 groups
 * Top 2 from each group advance to playoff.
 * Cross-bracket: A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, ...
 *
 * @returns {{ groupMatches, playoffMatches }}
 */
function generateGroupPlayoff(teams) {
    const n = teams.length;
    if (![8, 16, 32].includes(n)) {
        throw new Error('Group+Playoff requires exactly 8, 16, or 32 teams');
    }

    const shuffled = [...teams].sort(() => Math.random() - 0.5);
    const GROUP_LETTERS = 'ABCDEFGH';
    const groupSize = 4;
    const numGroups = n / groupSize;

    // ── Group stage ──────────────────────────────────────────────────────────
    const groupMatches = [];

    for (let g = 0; g < numGroups; g++) {
        const groupTeams = shuffled.slice(g * groupSize, (g + 1) * groupSize);
        const label = `Group ${GROUP_LETTERS[g]}`;
        const rounds = generateSingleRound(groupTeams);

        rounds.forEach(round => {
            round.forEach(match => {
                groupMatches.push({
                    teamA: match.teamA,
                    teamB: match.teamB,
                    round: label,
                    bracketSlot: null
                });
            });
        });
    }

    // ── Playoff placeholders ─────────────────────────────────────────────────
    // numAdvancing = numGroups * 2 (top 2 per group)
    // For 2 groups → 4 teams → 2 SF + 1 F
    // For 4 groups → 8 teams → 4 QF + 2 SF + 1 F
    // For 8 groups → 16 teams → 8 R16 + 4 QF + 2 SF + 1 F

    const numAdvancing = numGroups * 2;
    const numPlayoffRounds = Math.log2(numAdvancing);
    const playoffMatches = [];

    let matchesInRound = numAdvancing / 2;
    for (let r = 0; r < numPlayoffRounds; r++) {
        const roundLabel = getPlayoffRoundLabel(r, numPlayoffRounds);
        for (let i = 0; i < matchesInRound; i++) {
            playoffMatches.push({
                teamA: null,
                teamB: null,
                round: roundLabel,
                bracketSlot: i + 1
            });
        }
        matchesInRound = Math.max(1, Math.floor(matchesInRound / 2));
    }

    return { groupMatches, playoffMatches };
}

/**
 * Returns human-readable label for playoff round
 * r=0 with 3 total rounds → 'QF', r=1 → 'SF', r=2 → 'Final'
 */
function getPlayoffRoundLabel(roundIndex, totalRounds) {
    const fromEnd = totalRounds - 1 - roundIndex;
    if (fromEnd === 0) return 'Final';
    if (fromEnd === 1) return 'SF';
    if (fromEnd === 2) return 'QF';
    if (fromEnd === 3) return 'R16';
    return `PO-R${roundIndex + 1}`;
}

// ─── SCHEDULING ───────────────────────────────────────────────────────────────

/**
 * Schedule league matches (existing behavior, preserved)
 */
function scheduleMatches(rounds, settings) {
    const { startDate, matchDays, matchTime, matchesPerDay, daysBetweenRounds } = settings;

    const scheduledMatches = [];
    let currentDate = new Date(startDate);
    let roundNumber = 1;

    for (const round of rounds) {
        let matchesScheduledInRound = 0;

        for (const match of round) {
            while (!matchDays.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }

            scheduledMatches.push({
                round: String(roundNumber),
                teamAId: match.teamA ? match.teamA.id : null,
                teamBId: match.teamB ? match.teamB.id : null,
                matchDate: formatDateTime(currentDate, matchTime),
                bracketSlot: match.bracketSlot || null
            });

            matchesScheduledInRound++;

            if (matchesScheduledInRound % matchesPerDay === 0 && matchesScheduledInRound < round.length) {
                do {
                    currentDate.setDate(currentDate.getDate() + 1);
                } while (!matchDays.includes(currentDate.getDay()));
            }
        }

        currentDate.setDate(currentDate.getDate() + 1);
        if (daysBetweenRounds > 0) {
            currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
        }

        roundNumber++;
    }

    return scheduledMatches;
}

/**
 * Schedule playoff rounds.
 * Round 1 gets real dates. Later rounds get estimated dates (round_index * restDays).
 */
function schedulePlayoffMatches(allRounds, settings) {
    const { startDate, matchDays, matchTime, matchesPerDay, daysBetweenRounds } = settings;
    const restDays = daysBetweenRounds || 7;

    const scheduledMatches = [];
    let currentDate = new Date(startDate);

    for (let roundIdx = 0; roundIdx < allRounds.length; roundIdx++) {
        const round = allRounds[roundIdx];
        let scheduledToday = 0;

        while (!matchDays.includes(currentDate.getDay())) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        for (const match of round) {
            scheduledMatches.push({
                round: String(roundIdx + 1),
                teamAId: match.teamA ? match.teamA.id : null,
                teamBId: match.teamB ? match.teamB.id : null,
                matchDate: formatDateTime(currentDate, matchTime),
                bracketSlot: match.bracketSlot
            });

            scheduledToday++;
            if (scheduledToday >= matchesPerDay && match !== round[round.length - 1]) {
                do {
                    currentDate.setDate(currentDate.getDate() + 1);
                } while (!matchDays.includes(currentDate.getDay()));
                scheduledToday = 0;
            }
        }

        // Move to next round date
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + restDays);
        while (!matchDays.includes(currentDate.getDay())) {
            currentDate.setDate(currentDate.getDate() + 1);
        }
    }

    return scheduledMatches;
}

/**
 * Schedule group+playoff matches.
 * Group stage first, then playoff rounds after estimated group end.
 */
function scheduleGroupPlayoffMatches(groupMatches, playoffMatches, settings) {
    const { startDate, matchDays, matchTime, matchesPerDay, daysBetweenRounds } = settings;
    const restDays = daysBetweenRounds || 3;

    const scheduledGroup = [];
    let currentDate = new Date(startDate);

    // Schedule group matches sequentially (same as league)
    for (const match of groupMatches) {
        while (!matchDays.includes(currentDate.getDay())) {
            currentDate.setDate(currentDate.getDate() + 1);
        }

        scheduledGroup.push({
            round: match.round,
            teamAId: match.teamA ? match.teamA.id : null,
            teamBId: match.teamB ? match.teamB.id : null,
            matchDate: formatDateTime(currentDate, matchTime),
            bracketSlot: null
        });

        // Move to next match slot
        currentDate = new Date(currentDate);
        currentDate.setDate(currentDate.getDate() + 1);
        if (restDays > 0) currentDate.setDate(currentDate.getDate() + restDays - 1);
    }

    // Playoff starts after group stage + buffer
    currentDate.setDate(currentDate.getDate() + 7);
    while (!matchDays.includes(currentDate.getDay())) {
        currentDate.setDate(currentDate.getDate() + 1);
    }

    const scheduledPlayoff = [];
    let lastRound = null;

    for (const match of playoffMatches) {
        if (lastRound !== null && match.round !== lastRound) {
            // New playoff round → add rest days
            currentDate.setDate(currentDate.getDate() + 7);
            while (!matchDays.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }

        scheduledPlayoff.push({
            round: match.round,
            teamAId: null,
            teamBId: null,
            matchDate: formatDateTime(currentDate, matchTime),
            bracketSlot: match.bracketSlot
        });

        lastRound = match.round;
    }

    return [...scheduledGroup, ...scheduledPlayoff];
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────

function formatDateTime(date, time) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} ${time}:00`;
}

function calculateEndDate(rounds, settings) {
    const { startDate, matchDays, matchesPerDay, daysBetweenRounds } = settings;
    let currentDate = new Date(startDate);

    for (const round of rounds) {
        let matchesScheduledInRound = 0;
        for (const match of round) {
            while (!matchDays.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            matchesScheduledInRound++;
            if (matchesScheduledInRound % matchesPerDay === 0 && matchesScheduledInRound < round.length) {
                do { currentDate.setDate(currentDate.getDate() + 1); }
                while (!matchDays.includes(currentDate.getDay()));
            }
        }
        currentDate.setDate(currentDate.getDate() + 1);
        if (daysBetweenRounds > 0) currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
    }

    return currentDate.toISOString().split('T')[0];
}

module.exports = {
    generateRoundRobinDouble,
    generateSingleRound,
    generatePlayoff,
    generateGroupPlayoff,
    scheduleMatches,
    schedulePlayoffMatches,
    scheduleGroupPlayoffMatches,
    calculateEndDate,
    getPlayoffRoundLabel
};
