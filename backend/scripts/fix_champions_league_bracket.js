/**
 * Fix Champions League 2026 bracket data
 * Semi-final matches are stored as round='2' instead of round='1'
 * Run: cd backend && node scripts/fix_champions_league_bracket.js
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../config/database');

async function fix() {
    try {
        // Find the tournament
        const [tournaments] = await db.promise().query(
            `SELECT id, name FROM tournaments WHERE name = 'Champions League 2026'`
        );
        if (tournaments.length === 0) {
            console.log('Tournament not found');
            process.exit(1);
        }
        const tournamentId = tournaments[0].id;
        console.log(`Found: ${tournaments[0].name} (ID: ${tournamentId})`);

        // Get all current matches
        const [matches] = await db.promise().query(
            `SELECT m.*, t1.name as t1, t2.name as t2
             FROM matches m
             LEFT JOIN teams t1 ON m.team1_id = t1.id
             LEFT JOIN teams t2 ON m.team2_id = t2.id
             WHERE m.tournament_id = ?
             ORDER BY m.round, m.bracket_slot`,
            [tournamentId]
        );

        console.log(`\nCurrent matches (${matches.length} total):`);
        matches.forEach(m => console.log(`  ID:${m.id} round=${m.round} slot=${m.bracket_slot} ${m.t1||'TBD'} vs ${m.t2||'TBD'} [${m.status}] ${m.team1_score}-${m.team2_score}`));

        // Find finished matches (these are the semi-finals stored as round 2)
        const semiFinals = matches.filter(m => m.status === 'finished');
        if (semiFinals.length === 0) {
            console.log('\nNo finished matches found');
            process.exit(0);
        }

        console.log(`\nMoving ${semiFinals.length} semi-final(s) to round=1...`);

        // Delete any existing scheduled round 2 match (cleanup)
        await db.promise().query(
            `DELETE FROM matches WHERE tournament_id = ? AND status = 'scheduled'`,
            [tournamentId]
        );

        // Update semi-finals to round=1
        for (let i = 0; i < semiFinals.length; i++) {
            await db.promise().query(
                `UPDATE matches SET round = '1', bracket_slot = ? WHERE id = ?`,
                [i + 1, semiFinals[i].id]
            );
            console.log(`  Updated match ID:${semiFinals[i].id} → round=1, slot=${i+1}`);
        }

        // Determine finalists (winners of semi-finals)
        let finalist1 = null, finalist2 = null;
        for (const m of semiFinals) {
            const winner = m.team1_score > m.team2_score ? m.team1_id : m.team2_id;
            const winnerName = m.team1_score > m.team2_score ? m.t1 : m.t2;
            if (!finalist1) {
                finalist1 = { id: winner, name: winnerName };
            } else {
                finalist2 = { id: winner, name: winnerName };
            }
        }

        // Get match date: last semi-final date + 3 days
        const [lastMatch] = await db.promise().query(
            `SELECT MAX(match_date) as last_date FROM matches WHERE tournament_id = ? AND round = '1'`,
            [tournamentId]
        );
        const finalDate = new Date(lastMatch[0].last_date);
        finalDate.setDate(finalDate.getDate() + 3);
        const finalDateStr = finalDate.toISOString().slice(0, 10) + ' 18:00:00';

        // Create Final match
        const [result] = await db.promise().query(
            `INSERT INTO matches (tournament_id, round, team1_id, team2_id, match_date, status, bracket_slot)
             VALUES (?, '2', ?, ?, ?, 'scheduled', 1)`,
            [tournamentId, finalist1.id, finalist2.id, finalDateStr]
        );

        console.log(`\n✅ Created Final match (ID:${result.insertId})`);
        console.log(`   ${finalist1.name} vs ${finalist2.name}`);
        console.log(`   Date: ${finalDateStr}`);

        console.log('\n✅ Done! Restart server and refresh browser.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fix();
