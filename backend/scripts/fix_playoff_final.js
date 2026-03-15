/**
 * Fix missing Final match for playoff tournaments
 * Run: cd backend && node scripts/fix_playoff_final.js
 */

const db = require('../config/database');

async function fixPlayoffFinals() {
    try {
        // Find all playoff tournaments that have finished round 1 but no round 2
        const [tournaments] = await db.promise().query(`
            SELECT t.id, t.name, t.max_teams
            FROM tournaments t
            WHERE t.type = 'playoff'
              AND EXISTS (
                SELECT 1 FROM matches m WHERE m.tournament_id = t.id AND m.round = '1'
              )
              AND NOT EXISTS (
                SELECT 1 FROM matches m WHERE m.tournament_id = t.id AND m.round = '2'
              )
        `);

        if (tournaments.length === 0) {
            console.log('No tournaments need fixing.');
            process.exit(0);
        }

        console.log(`Found ${tournaments.length} tournament(s) to fix:`);

        for (const tournament of tournaments) {
            console.log(`\nFixing: ${tournament.name} (ID: ${tournament.id})`);

            // Get all Round 1 matches
            const [round1Matches] = await db.promise().query(`
                SELECT m.*,
                    t1.name as team1_name, t2.name as team2_name
                FROM matches m
                LEFT JOIN teams t1 ON m.team1_id = t1.id
                LEFT JOIN teams t2 ON m.team2_id = t2.id
                WHERE m.tournament_id = ? AND m.round = '1'
                ORDER BY m.bracket_slot
            `, [tournament.id]);

            console.log(`  Round 1 matches: ${round1Matches.length}`);

            // Calculate how many Final matches needed
            // For 4 teams: 2 semi-finals → 1 final
            // For 8 teams: 4 QF → final is round 3
            const numRound1Matches = round1Matches.length;
            const numRound2Matches = numRound1Matches / 2;

            // Get the last match date to set Final date +7 days
            const [lastMatch] = await db.promise().query(`
                SELECT MAX(match_date) as last_date, MAX(id) as last_id
                FROM matches WHERE tournament_id = ? AND round = '1'
            `, [tournament.id]);

            const lastDate = new Date(lastMatch[0].last_date);
            const finalDate = new Date(lastDate);
            finalDate.setDate(finalDate.getDate() + 7);
            // Format as YYYY-MM-DD HH:MM:SS
            const finalDateStr = finalDate.toISOString().slice(0, 10) + ' 18:00:00';

            // Insert Round 2 matches
            for (let slot = 1; slot <= numRound2Matches; slot++) {
                // Determine team1 (winner of odd bracket slot) and team2 (winner of even bracket slot)
                const team1Match = round1Matches.find(m => m.bracket_slot === (slot * 2 - 1));
                const team2Match = round1Matches.find(m => m.bracket_slot === (slot * 2));

                let team1Id = null;
                let team2Id = null;

                // If Round 1 match is finished, use winner
                if (team1Match && team1Match.status === 'finished') {
                    team1Id = team1Match.team1_score > team1Match.team2_score
                        ? team1Match.team1_id : team1Match.team2_id;
                    console.log(`  Slot ${slot} team1: ${team1Id} (winner of match bracket_slot=${team1Match.bracket_slot})`);
                }
                if (team2Match && team2Match.status === 'finished') {
                    team2Id = team2Match.team1_score > team2Match.team2_score
                        ? team2Match.team1_id : team2Match.team2_id;
                    console.log(`  Slot ${slot} team2: ${team2Id} (winner of match bracket_slot=${team2Match.bracket_slot})`);
                }

                const [result] = await db.promise().query(`
                    INSERT INTO matches (tournament_id, round, team1_id, team2_id, match_date, status, bracket_slot)
                    VALUES (?, '2', ?, ?, ?, 'scheduled', ?)
                `, [tournament.id, team1Id, team2Id, finalDateStr, slot]);

                console.log(`  ✅ Inserted Round 2 match (id=${result.insertId}, slot=${slot}, date=${finalDateStr})`);
                if (team1Id && team2Id) {
                    console.log(`     Teams: ${team1Id} vs ${team2Id}`);
                } else {
                    console.log(`     Teams: TBD (${team1Id || 'TBD'} vs ${team2Id || 'TBD'})`);
                }
            }

            console.log(`  ✅ ${tournament.name} fixed!`);
        }

        console.log('\nAll done!');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixPlayoffFinals();
