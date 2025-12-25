/* ==============================================
   FIXTURES GENERATOR - Խաղացանկի ալգորիթմ
   ============================================== */

/**
 * Round-Robin Double (յուրաքանչյուր թիմ խաղում է բոլորի հետ 2 անգամ)
 */
function generateRoundRobinDouble(teams) {
    const fixtures = [];
    const n = teams.length;
    
    if (n < 2) {
        throw new Error('Նվազագույնը 2 թիմ է պետք');
    }
    
    // Առաջին շրջան (First Leg)
    const firstLeg = generateSingleRound(teams);
    
    // Երկրորդ շրջան (Second Leg - հակառակը)
    const secondLeg = firstLeg.map(match => ({
        teamA: match.teamB,
        teamB: match.teamA
    }));
    
    return [...firstLeg, ...secondLeg];
}

/**
 * Մեկ շրջան (յուրաքանչյուր թիմ խաղում է բոլորի հետ 1 անգամ)
 */
function generateSingleRound(teams) {
    const fixtures = [];
    const n = teams.length;
    
    // Յուրաքանչյուր թիմի հետ
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            fixtures.push({
                teamA: teams[i],
                teamB: teams[j]
            });
        }
    }
    
    return fixtures;
}

/**
 * Ավելացնել ամսաթվեր և մանրամասներ
 */
function scheduleMatches(fixtures, settings) {
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
    let matchIndex = 0;
    let round = 1;
    
    while (matchIndex < fixtures.length) {
        // Ստուգել՝ այս օրը matchDay է՞
        const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon, 2=Tue...
        
        if (matchDays.includes(dayOfWeek)) {
            // Այս օրը խաղեր ունենք
            const matchesForThisDay = Math.min(matchesPerDay, fixtures.length - matchIndex);
            
            for (let i = 0; i < matchesForThisDay; i++) {
                const fixture = fixtures[matchIndex];
                
                scheduledMatches.push({
                    round: round,
                    teamAId: fixture.teamA.id,
                    teamBId: fixture.teamB.id,
                    matchDate: formatDateTime(currentDate, matchTime),
                    venue: venue || 'TBD'
                });
                
                matchIndex++;
            }
            
            round++;
            
            // Հանգստի օրեր rounds-ի միջև
            if (daysBetweenRounds > 0 && matchIndex < fixtures.length) {
                currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
            }
        }
        
        // Հաջորդ օրը
        currentDate.setDate(currentDate.getDate() + 1);
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
 */
function calculateEndDate(startDate, matchDays, matchesPerDay, totalMatches, daysBetweenRounds) {
    let currentDate = new Date(startDate);
    let matchIndex = 0;
    let roundsScheduled = 0;
    
    while (matchIndex < totalMatches) {
        const dayOfWeek = currentDate.getDay();
        
        if (matchDays.includes(dayOfWeek)) {
            const matchesForThisDay = Math.min(matchesPerDay, totalMatches - matchIndex);
            matchIndex += matchesForThisDay;
            roundsScheduled++;
            
            if (daysBetweenRounds > 0 && matchIndex < totalMatches) {
                currentDate.setDate(currentDate.getDate() + daysBetweenRounds);
            }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return currentDate.toISOString().split('T')[0];
}

module.exports = {
    generateRoundRobinDouble,
    scheduleMatches,
    calculateEndDate
};