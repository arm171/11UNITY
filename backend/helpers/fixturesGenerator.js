/* ==============================================
   FIXTURES GENERATOR - Խաղացանկի ալգորիթմ
   FINAL FIX: Round-Robin + Ամսաթվերի ճիշտ հաշվարկ
   ============================================== */

/**
 * Round-Robin Double (յուրաքանչյուր թիմ խաղում է բոլորի հետ 2 անգամ)
 */
function generateRoundRobinDouble(teams) {
    const n = teams.length;
    
    if (n < 2) {
        throw new Error('Նվազագույնը 2 թիմ է պետք');
    }
    
    // Առաջին շրջան (First Leg) - array of rounds
    const firstLegRounds = generateSingleRound(teams);
    
    // Երկրորդ շրջան (Second Leg - հակառակը)
    const secondLegRounds = firstLegRounds.map(round => {
        return round.map(match => ({
            teamA: match.teamB,
            teamB: match.teamA
        }));
    });
    
    // Միացնում ենք երկու leg-երը
    return [...firstLegRounds, ...secondLegRounds];
}

/**
 * Մեկ շրջան (յուրաքանչյուր թիմ խաղում է բոլորի հետ 1 անգամ)
 * Օգտագործում է Round-Robin Scheduling Algorithm
 * Յուրաքանչյուր round-ում յուրաքանչյուր թիմ խաղում է ՄԵԿ անգամ
 * 
 * Օրինակ 4 թիմ (A, B, C, D):
 * Round 1: A vs B, C vs D
 * Round 2: A vs C, B vs D
 * Round 3: A vs D, B vs C
 */
function generateSingleRound(teams) {
    const n = teams.length;
    const rounds = [];
    
    // Եթե կենտ թիմ կա, ավելացնում ենք dummy "BYE"
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
            
            // Վերջին թիմը միշտ ֆիքս է
            const homeTeam = match === 0 ? teamList[totalTeams - 1] : teamList[home];
            const awayTeam = teamList[away];
            
            // Բաց թողնում ենք BYE խաղերը
            if (homeTeam.id !== null && awayTeam.id !== null) {
                roundMatches.push({
                    teamA: homeTeam,
                    teamB: awayTeam
                });
            }
        }
        
        rounds.push(roundMatches);
    }
    
    // Վերադարձնում ենք որպես array of rounds
    return rounds;
}

/**
 * Ավելացնել ամսաթվեր և մանրամասներ
 * rounds-ը հիմա array of rounds է, ոչ թե flat array
 * 
 * ՖԻՔՍ: Յուրաքանչյուր round-ը ՊԱՐՏԱԴԻՐ տարբեր օր է
 */
function scheduleMatches(rounds, settings) {
    const {
        startDate,
        matchDays,         // [1, 3, 5] = Երկ, Չրք, Ուրբ
        matchTime,         // "18:00"
        matchesPerDay,     // 2
        daysBetweenRounds, // 3
        venue
    } = settings;
    
    const scheduledMatches = [];
    let currentDate = new Date(startDate);
    let roundNumber = 1;
    
    // Յուրաքանչյուր round-ի համար
    for (const round of rounds) {
        let matchesScheduledInRound = 0;
        
        // Round-ի մեջ յուրաքանչյուր match
        for (const match of round) {
            // Գտնում ենք հաջորդ match day-ը
            while (!matchDays.includes(currentDate.getDay())) {
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            scheduledMatches.push({
                round: roundNumber,
                teamAId: match.teamA.id,
                teamBId: match.teamB.id,
                matchDate: formatDateTime(currentDate, matchTime),
                venue: venue || 'TBD'
            });
            
            matchesScheduledInRound++;
            
            // Եթե օրվա limit-ը լրացել է ԵՎ դեռ matches-ներ կան այս round-ում
            if (matchesScheduledInRound % matchesPerDay === 0 && matchesScheduledInRound < round.length) {
                // Անցնում ենք հաջորդ match day-ին
                do {
                    currentDate.setDate(currentDate.getDate() + 1);
                } while (!matchDays.includes(currentDate.getDay()));
            }
        }
        
        // Round-ը ավարտվեց
        // ՖԻՔՍ: Անցնում ենք հաջորդ օրը (ՊԱՐՏԱԴԻՐ)
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Ավելացնում ենք rest days (եթե կա)
        if (daysBetweenRounds > 0) {
            currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
        }
        
        roundNumber++;
    }
    
    return scheduledMatches;
}

/**
 * Format date + time
 */
function formatDateTime(date, time) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${time}:00`;
}

/**
 * Հաշվել վերջնական ամսաթիվը
 * 
 * ՖԻՔՍ: Յուրաքանչյուր round-ը ՊԱՐՏԱԴԻՐ տարբեր օր է
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
        
        // Round-ը ավարտվեց
        // ՖԻՔՍ: Անցնում ենք հաջորդ օրը (ՊԱՐՏԱԴԻՐ)
        currentDate.setDate(currentDate.getDate() + 1);
        
        // Ավելացնում ենք rest days (եթե կա)
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