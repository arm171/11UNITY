/**
 * 11UNITY - DATABASE SEED SCRIPT
 * Creates realistic demo data for diploma presentation
 * Run: node seed.js (from backend folder)
 *
 * USER IDs:
 *   1  = Admin       (admin@11unity.com / admin123)
 *   2  = Organizer1  (organizer1@11unity.am) → owns League + Championship
 *   3  = Organizer2  (organizer2@11unity.am) → owns Armenia Cup
 *   4-11 = Coaches (one per team)
 *   12-99 = Players  (11 per team × 8 teams)
 *   playerId = 12 + teamIndex * 11 + playerIndex(0-10)
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || '11UNITY_db',
};

// ── TEAMS ─────────────────────────────────────────────────────────────────────
const TEAMS_DATA = [
    { name: 'FC Ararat-Armenia', logo: 'ARA', color: '#FF6B35' }, // team 1, coach 4
    { name: 'FC Pyunik',         logo: 'PYU', color: '#FFD700' }, // team 2, coach 5
    { name: 'FC Urartu',         logo: 'URA', color: '#1E90FF' }, // team 3, coach 6
    { name: 'FC Alashkert',      logo: 'ALA', color: '#32CD32' }, // team 4, coach 7
    { name: 'FC Noah',           logo: 'NOA', color: '#9370DB' }, // team 5, coach 8
    { name: 'FC Van',            logo: 'VAN', color: '#FF4500' }, // team 6, coach 9
    { name: 'FC BKMA',           logo: 'BKM', color: '#20B2AA' }, // team 7, coach 10
    { name: 'FC Gandzasar',      logo: 'GAN', color: '#DC143C' }, // team 8, coach 11
];

const COACH_NAMES = [
    'Armen Mkrtchyan',
    'Levon Ghazaryan',
    'Vardan Minasyan',
    'Narek Sargsyan',
    'Davit Karapetyan',
    'Tigran Hovhannisyan',
    'Artur Aleksanyan',
    'Samvel Babayan',
];

const POSITIONS = [
    'goalkeeper',
    'defender', 'defender', 'defender', 'defender',
    'midfielder', 'midfielder', 'midfielder', 'midfielder',
    'forward', 'forward',
];

// ── MATCH DATA ────────────────────────────────────────────────────────────────

// Tournament 1: Armenian Premier League 2025/26 (active)
// Teams: ARA=1 PYU=2 URA=3 ALA=4 NOA=5 VAN=6 BKM=7 GAN=8
// Rounds 1-4 finished (Feb–Mar 2026), rounds 5-7 scheduled (Apr–May 2026)
const LEAGUE_MATCHES = [
    // Round 1 — Feb 8, 2026 (finished)
    { t1: 8, t2: 1, s1: 0, s2: 3, date: '2026-02-08 18:00:00', round: '1', status: 'finished' },
    { t1: 2, t2: 7, s1: 2, s2: 0, date: '2026-02-08 20:00:00', round: '1', status: 'finished' },
    { t1: 3, t2: 6, s1: 1, s2: 0, date: '2026-02-09 18:00:00', round: '1', status: 'finished' },
    { t1: 4, t2: 5, s1: 1, s2: 1, date: '2026-02-09 20:00:00', round: '1', status: 'finished' },
    // Round 2 — Feb 15, 2026 (finished)
    { t1: 8, t2: 2, s1: 0, s2: 2, date: '2026-02-15 18:00:00', round: '2', status: 'finished' },
    { t1: 3, t2: 1, s1: 0, s2: 2, date: '2026-02-15 20:00:00', round: '2', status: 'finished' },
    { t1: 4, t2: 7, s1: 2, s2: 1, date: '2026-02-16 18:00:00', round: '2', status: 'finished' },
    { t1: 5, t2: 6, s1: 2, s2: 0, date: '2026-02-16 20:00:00', round: '2', status: 'finished' },
    // Round 3 — Feb 22, 2026 (finished)
    { t1: 8, t2: 3, s1: 0, s2: 2, date: '2026-02-22 18:00:00', round: '3', status: 'finished' },
    { t1: 4, t2: 2, s1: 0, s2: 2, date: '2026-02-22 20:00:00', round: '3', status: 'finished' },
    { t1: 5, t2: 1, s1: 1, s2: 2, date: '2026-02-23 18:00:00', round: '3', status: 'finished' },
    { t1: 6, t2: 7, s1: 1, s2: 0, date: '2026-02-23 20:00:00', round: '3', status: 'finished' },
    // Round 4 — Mar 8, 2026 (finished)
    { t1: 8, t2: 4, s1: 0, s2: 1, date: '2026-03-08 18:00:00', round: '4', status: 'finished' },
    { t1: 5, t2: 3, s1: 1, s2: 1, date: '2026-03-08 20:00:00', round: '4', status: 'finished' },
    { t1: 6, t2: 2, s1: 0, s2: 3, date: '2026-03-09 18:00:00', round: '4', status: 'finished' },
    { t1: 7, t2: 1, s1: 0, s2: 3, date: '2026-03-09 20:00:00', round: '4', status: 'finished' },
    // Round 5 — Apr 5, 2026 (scheduled — future)
    { t1: 8, t2: 5, s1: 0, s2: 0, date: '2026-04-05 18:00:00', round: '5', status: 'scheduled' },
    { t1: 6, t2: 4, s1: 0, s2: 0, date: '2026-04-05 20:00:00', round: '5', status: 'scheduled' },
    { t1: 7, t2: 3, s1: 0, s2: 0, date: '2026-04-06 18:00:00', round: '5', status: 'scheduled' },
    { t1: 1, t2: 2, s1: 0, s2: 0, date: '2026-04-06 20:00:00', round: '5', status: 'scheduled' },
    // Round 6 — Apr 19, 2026 (scheduled — future)
    { t1: 8, t2: 6, s1: 0, s2: 0, date: '2026-04-19 18:00:00', round: '6', status: 'scheduled' },
    { t1: 7, t2: 5, s1: 0, s2: 0, date: '2026-04-19 20:00:00', round: '6', status: 'scheduled' },
    { t1: 1, t2: 4, s1: 0, s2: 0, date: '2026-04-20 18:00:00', round: '6', status: 'scheduled' },
    { t1: 2, t2: 3, s1: 0, s2: 0, date: '2026-04-20 20:00:00', round: '6', status: 'scheduled' },
    // Round 7 — May 3, 2026 (scheduled — future)
    { t1: 8, t2: 7, s1: 0, s2: 0, date: '2026-05-03 18:00:00', round: '7', status: 'scheduled' },
    { t1: 1, t2: 6, s1: 0, s2: 0, date: '2026-05-03 20:00:00', round: '7', status: 'scheduled' },
    { t1: 2, t2: 5, s1: 0, s2: 0, date: '2026-05-04 18:00:00', round: '7', status: 'scheduled' },
    { t1: 3, t2: 4, s1: 0, s2: 0, date: '2026-05-04 20:00:00', round: '7', status: 'scheduled' },
];

// Tournament 3: Armenian Championship 2025 (finished, group_playoff)
// Group A: ARA(1) PYU(2) URA(3) ALA(4) | Group B: NOA(5) VAN(6) BKM(7) GAN(8)
const CHAMP_MATCHES = [
    // Group A — Aug 2025
    { t1: 1, t2: 2, s1: 2, s2: 1, date: '2025-08-10 18:00:00', round: 'Group A', status: 'finished', slot: null },
    { t1: 3, t2: 4, s1: 1, s2: 0, date: '2025-08-10 20:00:00', round: 'Group A', status: 'finished', slot: null },
    { t1: 1, t2: 3, s1: 3, s2: 0, date: '2025-08-17 18:00:00', round: 'Group A', status: 'finished', slot: null },
    { t1: 2, t2: 4, s1: 2, s2: 0, date: '2025-08-17 20:00:00', round: 'Group A', status: 'finished', slot: null },
    { t1: 1, t2: 4, s1: 2, s2: 0, date: '2025-08-24 18:00:00', round: 'Group A', status: 'finished', slot: null },
    { t1: 2, t2: 3, s1: 1, s2: 1, date: '2025-08-24 20:00:00', round: 'Group A', status: 'finished', slot: null },
    // Group B — Aug 2025
    { t1: 5, t2: 6, s1: 2, s2: 0, date: '2025-08-11 18:00:00', round: 'Group B', status: 'finished', slot: null },
    { t1: 7, t2: 8, s1: 2, s2: 0, date: '2025-08-11 20:00:00', round: 'Group B', status: 'finished', slot: null },
    { t1: 5, t2: 7, s1: 3, s2: 1, date: '2025-08-18 18:00:00', round: 'Group B', status: 'finished', slot: null },
    { t1: 6, t2: 8, s1: 2, s2: 1, date: '2025-08-18 20:00:00', round: 'Group B', status: 'finished', slot: null },
    { t1: 5, t2: 8, s1: 1, s2: 0, date: '2025-08-25 18:00:00', round: 'Group B', status: 'finished', slot: null },
    { t1: 6, t2: 7, s1: 2, s2: 0, date: '2025-08-25 20:00:00', round: 'Group B', status: 'finished', slot: null },
    // Semi-Finals — Sep 7, 2025 (A1 vs B2, B1 vs A2)
    { t1: 1, t2: 6, s1: 3, s2: 1, date: '2025-09-07 18:00:00', round: 'SF', status: 'finished', slot: 1 },
    { t1: 5, t2: 2, s1: 2, s2: 0, date: '2025-09-07 20:00:00', round: 'SF', status: 'finished', slot: 2 },
    // Final — Sep 14, 2025
    { t1: 1, t2: 5, s1: 2, s2: 1, date: '2025-09-14 19:00:00', round: 'Final', status: 'finished', slot: 1 },
];

// ── STANDINGS ─────────────────────────────────────────────────────────────────

// League standings after rounds 1-4
const LEAGUE_STANDINGS = [
    { teamIdx: 0, p: 4, w: 4, d: 0, l: 0, gf: 10, ga: 1 },  // ARA 12pts
    { teamIdx: 1, p: 4, w: 4, d: 0, l: 0, gf:  9, ga: 0 },  // PYU 12pts
    { teamIdx: 2, p: 4, w: 2, d: 1, l: 1, gf:  4, ga: 3 },  // URA  7pts
    { teamIdx: 3, p: 4, w: 2, d: 1, l: 1, gf:  4, ga: 4 },  // ALA  7pts
    { teamIdx: 4, p: 4, w: 1, d: 2, l: 1, gf:  5, ga: 4 },  // NOA  5pts
    { teamIdx: 5, p: 4, w: 1, d: 0, l: 3, gf:  1, ga: 6 },  // VAN  3pts
    { teamIdx: 6, p: 4, w: 0, d: 0, l: 4, gf:  1, ga: 8 },  // BKM  0pts
    { teamIdx: 7, p: 4, w: 0, d: 0, l: 4, gf:  0, ga: 8 },  // GAN  0pts
];

// Championship group stage standings
const CHAMP_STANDINGS = [
    { teamIdx: 0, p: 3, w: 3, d: 0, l: 0, gf:  7, ga: 1 },  // ARA 9pts
    { teamIdx: 1, p: 3, w: 1, d: 1, l: 1, gf:  4, ga: 3 },  // PYU 4pts
    { teamIdx: 2, p: 3, w: 1, d: 1, l: 1, gf:  2, ga: 4 },  // URA 4pts
    { teamIdx: 3, p: 3, w: 0, d: 0, l: 3, gf:  0, ga: 5 },  // ALA 0pts
    { teamIdx: 4, p: 3, w: 3, d: 0, l: 0, gf:  6, ga: 1 },  // NOA 9pts
    { teamIdx: 5, p: 3, w: 2, d: 0, l: 1, gf:  4, ga: 3 },  // VAN 6pts
    { teamIdx: 6, p: 3, w: 1, d: 0, l: 2, gf:  3, ga: 5 },  // BKM 3pts
    { teamIdx: 7, p: 3, w: 0, d: 0, l: 3, gf:  1, ga: 5 },  // GAN 0pts
];

// ── PLAYER STATISTICS ─────────────────────────────────────────────────────────
// playerId = 12 + teamIdx * 11 + (jersey - 1)

const CHAMP_PLAYER_STATS = [
    { tIdx: 0, jersey: 9,  goals: 5, assists: 2 },
    { tIdx: 0, jersey: 10, goals: 3, assists: 3 },
    { tIdx: 0, jersey: 11, goals: 2, assists: 1 },
    { tIdx: 0, jersey: 7,  goals: 2, assists: 2 },
    { tIdx: 1, jersey: 9,  goals: 3, assists: 1 },
    { tIdx: 1, jersey: 10, goals: 1, assists: 2 },
    { tIdx: 2, jersey: 9,  goals: 2, assists: 0 },
    { tIdx: 4, jersey: 9,  goals: 4, assists: 2 },
    { tIdx: 4, jersey: 10, goals: 2, assists: 1 },
    { tIdx: 4, jersey: 7,  goals: 1, assists: 1 },
    { tIdx: 5, jersey: 9,  goals: 3, assists: 0 },
    { tIdx: 5, jersey: 10, goals: 1, assists: 1 },
    { tIdx: 6, jersey: 9,  goals: 2, assists: 0 },
    { tIdx: 7, jersey: 9,  goals: 1, assists: 0 },
];

const LEAGUE_PLAYER_STATS = [
    { tIdx: 0, jersey: 9,  goals: 3, assists: 1 },
    { tIdx: 0, jersey: 10, goals: 2, assists: 2 },
    { tIdx: 1, jersey: 9,  goals: 3, assists: 0 },
    { tIdx: 1, jersey: 7,  goals: 2, assists: 1 },
    { tIdx: 2, jersey: 9,  goals: 1, assists: 1 },
    { tIdx: 4, jersey: 9,  goals: 2, assists: 0 },
    { tIdx: 5, jersey: 9,  goals: 1, assists: 0 },
];

// ── MATCH EVENTS (goals for finished matches) ─────────────────────────────────
// Player IDs quick reference (12 + tIdx*11 + jersey-1):
//   ARA: P7=18  P9=20  P10=21  P11=22
//   PYU: P7=29  P9=31  P10=32
//   URA: P9=42  P10=43
//   ALA: P9=53  P10=54
//   NOA: P7=62  P9=64  P10=65
//   VAN: P9=75  P10=76
//   BKM: P9=86
//   GAN: P9=97
//
// Match IDs (auto-increment after TRUNCATE):
//   League rounds 1-4: 1-16  |  rounds 5-7: 17-28 (scheduled, no events)
//   Cup SFs: 29-30
//   Champ Group A: 31-36  |  Group B: 37-42  |  SF: 43-44  |  Final: 45
//
// { mid, tid, pid, min, apid }  — all are goals (event_type='goal', is_own_goal=0)

const MATCH_EVENTS = [
    // ── League Round 1 ───────────────────────────────────────────────────────
    // Match 1: GAN 0:3 ARA
    { mid: 1,  tid: 1, pid: 20, min: 15, apid: null },
    { mid: 1,  tid: 1, pid: 21, min: 38, apid: 18   },
    { mid: 1,  tid: 1, pid: 22, min: 72, apid: null },
    // Match 2: PYU 2:0 BKM
    { mid: 2,  tid: 2, pid: 31, min: 28, apid: 29   },
    { mid: 2,  tid: 2, pid: 29, min: 65, apid: null },
    // Match 3: URA 1:0 VAN
    { mid: 3,  tid: 3, pid: 42, min: 55, apid: null },
    // Match 4: ALA 1:1 NOA
    { mid: 4,  tid: 4, pid: 53, min: 22, apid: null },
    { mid: 4,  tid: 5, pid: 64, min: 78, apid: 62   },
    // ── League Round 2 ───────────────────────────────────────────────────────
    // Match 5: GAN 0:2 PYU
    { mid: 5,  tid: 2, pid: 31, min: 34, apid: null },
    { mid: 5,  tid: 2, pid: 32, min: 61, apid: 31   },
    // Match 6: URA 0:2 ARA
    { mid: 6,  tid: 1, pid: 20, min: 18, apid: null },
    { mid: 6,  tid: 1, pid: 21, min: 55, apid: 20   },
    // Match 7: ALA 2:1 BKM
    { mid: 7,  tid: 4, pid: 53, min: 34, apid: null },
    { mid: 7,  tid: 4, pid: 54, min: 67, apid: 53   },
    { mid: 7,  tid: 7, pid: 86, min: 78, apid: null },
    // Match 8: NOA 2:0 VAN
    { mid: 8,  tid: 5, pid: 64, min: 41, apid: null },
    { mid: 8,  tid: 5, pid: 65, min: 73, apid: 64   },
    // ── League Round 3 ───────────────────────────────────────────────────────
    // Match 9: GAN 0:2 URA
    { mid: 9,  tid: 3, pid: 42, min: 29, apid: null },
    { mid: 9,  tid: 3, pid: 43, min: 68, apid: null },
    // Match 10: ALA 0:2 PYU
    { mid: 10, tid: 2, pid: 31, min: 45, apid: null },
    { mid: 10, tid: 2, pid: 29, min: 80, apid: 31   },
    // Match 11: NOA 1:2 ARA
    { mid: 11, tid: 5, pid: 64, min: 25, apid: null },
    { mid: 11, tid: 1, pid: 20, min: 60, apid: null },
    { mid: 11, tid: 1, pid: 21, min: 88, apid: 20   },
    // Match 12: VAN 1:0 BKM
    { mid: 12, tid: 6, pid: 75, min: 52, apid: null },
    // ── League Round 4 ───────────────────────────────────────────────────────
    // Match 13: GAN 0:1 ALA
    { mid: 13, tid: 4, pid: 53, min: 67, apid: null },
    // Match 14: NOA 1:1 URA
    { mid: 14, tid: 5, pid: 64, min: 33, apid: null },
    { mid: 14, tid: 3, pid: 42, min: 71, apid: null },
    // Match 15: VAN 0:3 PYU
    { mid: 15, tid: 2, pid: 31, min: 22, apid: null },
    { mid: 15, tid: 2, pid: 29, min: 51, apid: null },
    { mid: 15, tid: 2, pid: 32, min: 79, apid: null },
    // Match 16: BKM 0:3 ARA
    { mid: 16, tid: 1, pid: 20, min: 12, apid: null },
    { mid: 16, tid: 1, pid: 21, min: 48, apid: null },
    { mid: 16, tid: 1, pid: 22, min: 85, apid: null },
    // ── Championship Group A (IDs 31-36) ─────────────────────────────────────
    // Match 31: ARA 2:1 PYU
    { mid: 31, tid: 1, pid: 20, min: 14, apid: null },
    { mid: 31, tid: 1, pid: 21, min: 67, apid: 20   },
    { mid: 31, tid: 2, pid: 31, min: 82, apid: null },
    // Match 32: URA 1:0 ALA
    { mid: 32, tid: 3, pid: 42, min: 44, apid: null },
    // Match 33: ARA 3:0 URA
    { mid: 33, tid: 1, pid: 20, min: 10, apid: null },
    { mid: 33, tid: 1, pid: 21, min: 35, apid: 18   },
    { mid: 33, tid: 1, pid: 22, min: 78, apid: null },
    // Match 34: PYU 2:0 ALA
    { mid: 34, tid: 2, pid: 31, min: 30, apid: null },
    { mid: 34, tid: 2, pid: 32, min: 72, apid: null },
    // Match 35: ARA 2:0 ALA
    { mid: 35, tid: 1, pid: 20, min: 25, apid: null },
    { mid: 35, tid: 1, pid: 22, min: 60, apid: null },
    // Match 36: PYU 1:1 URA
    { mid: 36, tid: 2, pid: 32, min: 40, apid: null },
    { mid: 36, tid: 3, pid: 42, min: 85, apid: null },
    // ── Championship Group B (IDs 37-42) ─────────────────────────────────────
    // Match 37: NOA 2:0 VAN
    { mid: 37, tid: 5, pid: 64, min: 21, apid: null },
    { mid: 37, tid: 5, pid: 65, min: 66, apid: null },
    // Match 38: BKM 2:0 GAN
    { mid: 38, tid: 7, pid: 86, min: 35, apid: null },
    { mid: 38, tid: 7, pid: 86, min: 70, apid: null },
    // Match 39: NOA 3:1 BKM
    { mid: 39, tid: 5, pid: 64, min: 15, apid: null },
    { mid: 39, tid: 5, pid: 65, min: 52, apid: 62   },
    { mid: 39, tid: 5, pid: 62, min: 75, apid: null },
    { mid: 39, tid: 7, pid: 86, min: 88, apid: null },
    // Match 40: VAN 2:1 GAN
    { mid: 40, tid: 6, pid: 75, min: 28, apid: null },
    { mid: 40, tid: 6, pid: 76, min: 55, apid: null },
    { mid: 40, tid: 8, pid: 97, min: 80, apid: null },
    // Match 41: NOA 1:0 GAN
    { mid: 41, tid: 5, pid: 64, min: 63, apid: null },
    // Match 42: VAN 2:0 BKM
    { mid: 42, tid: 6, pid: 75, min: 18, apid: null },
    { mid: 42, tid: 6, pid: 76, min: 77, apid: 75   },
    // ── Championship Semi-Finals (IDs 43-44) ─────────────────────────────────
    // Match 43: ARA 3:1 VAN
    { mid: 43, tid: 1, pid: 20, min: 18, apid: null },
    { mid: 43, tid: 1, pid: 21, min: 44, apid: 20   },
    { mid: 43, tid: 6, pid: 75, min: 62, apid: null },
    { mid: 43, tid: 1, pid: 22, min: 88, apid: null },
    // Match 44: NOA 2:0 PYU
    { mid: 44, tid: 5, pid: 64, min: 35, apid: null },
    { mid: 44, tid: 5, pid: 65, min: 71, apid: 62   },
    // ── Championship Final (ID 45) ────────────────────────────────────────────
    // Match 45: ARA 2:1 NOA
    { mid: 45, tid: 1, pid: 20, min: 32, apid: 18   },
    { mid: 45, tid: 5, pid: 64, min: 56, apid: null },
    { mid: 45, tid: 1, pid: 21, min: 84, apid: 20   },
];

// ── MAIN ──────────────────────────────────────────────────────────────────────
async function seed() {
    const conn = await mysql.createConnection(DB_CONFIG);

    try {
        console.log('🚀 Starting seed...\n');

        // ── 1. CLEAN ─────────────────────────────────────────────────────────
        console.log('🧹 Cleaning all tables...');
        await conn.execute('SET FOREIGN_KEY_CHECKS = 0');
        for (const t of ['player_statistics', 'match_events', 'standings',
                         'matches', 'tournament_teams', 'tournaments',
                         'team_players', 'teams', 'users']) {
            await conn.execute(`TRUNCATE TABLE \`${t}\``);
            console.log(`   ✓ ${t}`);
        }
        await conn.execute('SET FOREIGN_KEY_CHECKS = 1');

        const pass = await bcrypt.hash('password123', 10);

        // ── 2. USERS ─────────────────────────────────────────────────────────
        console.log('\n👤 Creating users...');

        // ID = 1 — Admin
        const adminPass = await bcrypt.hash('admin123', 10);
        await conn.execute(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
            ['Admin', 'admin@11unity.com', adminPass, 'admin']
        );

        // ID = 2 — Organizer 1 → owns League + Championship
        await conn.execute(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
            ['Tigran Petrosyan', 'organizer1@11unity.am', pass, 'organizer']
        );

        // ID = 3 — Organizer 2 → owns Armenia Cup
        await conn.execute(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
            ['Armen Hovhannisyan', 'organizer2@11unity.am', pass, 'organizer']
        );

        // IDs = 4-11 — Coaches
        for (let i = 0; i < 8; i++) {
            await conn.execute(
                'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
                [COACH_NAMES[i], `coach${i + 1}@11unity.am`, pass, 'coach']
            );
        }

        // IDs = 12-99 — Players (11 per team × 8 teams)
        for (let t = 0; t < 8; t++) {
            for (let p = 1; p <= 11; p++) {
                const short = TEAMS_DATA[t].logo.toLowerCase();
                await conn.execute(
                    'INSERT INTO users (name, email, password, role, is_verified) VALUES (?, ?, ?, ?, 1)',
                    [
                        `${TEAMS_DATA[t].name} Player ${p}`,
                        `${short}player${p}@11unity.am`,
                        pass,
                        'player'
                    ]
                );
            }
        }
        console.log('   ✓ 1 admin, 2 organizers, 8 coaches, 88 players created');

        // ── 3. TEAMS ─────────────────────────────────────────────────────────
        console.log('\n🏟️  Creating teams...');

        // Team IDs = 1-8, coach_id = i + 4 (coaches are users 4-11)
        for (let i = 0; i < 8; i++) {
            await conn.execute(
                'INSERT INTO teams (name, logo, logo_color, coach_id, max_players) VALUES (?, ?, ?, ?, 25)',
                [TEAMS_DATA[i].name, TEAMS_DATA[i].logo, TEAMS_DATA[i].color, i + 4]
            );
        }

        // team_players: playerId = 12 + teamIdx * 11 + playerIdx(0-10)
        for (let t = 0; t < 8; t++) {
            for (let p = 0; p < 11; p++) {
                const playerId = 12 + t * 11 + p;
                await conn.execute(
                    'INSERT INTO team_players (team_id, player_id, position, jersey_number) VALUES (?, ?, ?, ?)',
                    [t + 1, playerId, POSITIONS[p], p + 1]
                );
            }
        }
        console.log('   ✓ 8 teams, 88 players assigned');

        // ── 4. TOURNAMENTS ───────────────────────────────────────────────────
        console.log('\n🏆 Creating tournaments...');

        // T1: Active league — organizer1 (ID=2)
        await conn.execute(
            `INSERT INTO tournaments
             (name, type, category, start_date, location, description, max_teams, min_players_per_team, status, organizer_id)
             VALUES (?, 'league', 'amateur', '2026-02-01', ?, ?, 8, 11, 'active', 2)`,
            [
                'Armenian Premier League 2025/26',
                'Vazgen Sargsyan Republican Stadium, Yerevan',
                'Official Armenian Premier League 2025/26 season. 8 top teams compete in a round-robin format.'
            ]
        );

        // T2: Upcoming playoff — organizer2 (ID=3)
        await conn.execute(
            `INSERT INTO tournaments
             (name, type, category, start_date, location, description, max_teams, min_players_per_team, status, organizer_id)
             VALUES (?, 'playoff', 'amateur', '2026-06-01', ?, ?, 4, 11, 'upcoming', 3)`,
            [
                'Armenia Cup 2026',
                'Mika Stadium, Yerevan',
                'Annual Armenian Cup 2026. Top 4 teams compete in a single-elimination knockout format.'
            ]
        );

        // T3: Finished championship — organizer1 (ID=2)
        await conn.execute(
            `INSERT INTO tournaments
             (name, type, category, start_date, location, description, max_teams, min_players_per_team, status, organizer_id)
             VALUES (?, 'group_playoff', 'amateur', '2025-08-01', ?, ?, 8, 11, 'finished', 2)`,
            [
                'Armenian Championship 2025',
                'Vazgen Sargsyan Republican Stadium, Yerevan',
                'Armenian Championship 2025. Group stage + knockout. FC Ararat-Armenia are the champions!'
            ]
        );

        console.log('   ✓ 3 tournaments created');

        // ── 5. TOURNAMENT TEAMS ──────────────────────────────────────────────
        console.log('\n📋 Adding teams to tournaments...');

        for (let i = 1; i <= 8; i++) {
            await conn.execute(
                `INSERT INTO tournament_teams (tournament_id, team_id, status) VALUES (1, ?, 'approved')`, [i]
            );
        }
        for (let i = 1; i <= 4; i++) {
            await conn.execute(
                `INSERT INTO tournament_teams (tournament_id, team_id, status) VALUES (2, ?, 'approved')`, [i]
            );
        }
        for (let i = 1; i <= 8; i++) {
            await conn.execute(
                `INSERT INTO tournament_teams (tournament_id, team_id, status) VALUES (3, ?, 'approved')`, [i]
            );
        }
        console.log('   ✓ Teams assigned to tournaments');

        // ── 6. MATCHES ───────────────────────────────────────────────────────
        console.log('\n⚽ Inserting matches...');

        // T1: League
        for (const m of LEAGUE_MATCHES) {
            await conn.execute(
                `INSERT INTO matches
                 (tournament_id, team1_id, team2_id, team1_score, team2_score, match_date, round, status, bracket_slot)
                 VALUES (1, ?, ?, ?, ?, ?, ?, ?, NULL)`,
                [m.t1, m.t2, m.s1, m.s2, m.date, m.round, m.status]
            );
        }

        // T2: Armenia Cup — Semi-Finals only (Final created after SFs are played)
        const CUP_MATCHES = [
            { t1: 1, t2: 4, round: '1', slot: 1, date: '2026-06-07 18:00:00' },
            { t1: 2, t2: 3, round: '1', slot: 2, date: '2026-06-07 20:00:00' },
        ];
        for (const m of CUP_MATCHES) {
            await conn.execute(
                `INSERT INTO matches
                 (tournament_id, team1_id, team2_id, team1_score, team2_score, match_date, round, status, bracket_slot)
                 VALUES (2, ?, ?, 0, 0, ?, ?, 'scheduled', ?)`,
                [m.t1, m.t2, m.date, m.round, m.slot]
            );
        }

        // T3: Championship
        for (const m of CHAMP_MATCHES) {
            await conn.execute(
                `INSERT INTO matches
                 (tournament_id, team1_id, team2_id, team1_score, team2_score, match_date, round, status, bracket_slot)
                 VALUES (3, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [m.t1, m.t2, m.s1, m.s2, m.date, m.round, m.status, m.slot]
            );
        }
        console.log(`   ✓ ${LEAGUE_MATCHES.length} league, 2 cup, ${CHAMP_MATCHES.length} championship matches`);

        // ── 7. STANDINGS ─────────────────────────────────────────────────────
        console.log('\n📊 Inserting standings...');

        for (const s of LEAGUE_STANDINGS) {
            await conn.execute(
                `INSERT INTO standings
                 (tournament_id, team_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points)
                 VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [s.teamIdx + 1, s.p, s.w, s.d, s.l, s.gf, s.ga, s.gf - s.ga, s.w * 3 + s.d]
            );
        }

        for (const s of CHAMP_STANDINGS) {
            await conn.execute(
                `INSERT INTO standings
                 (tournament_id, team_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points)
                 VALUES (3, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [s.teamIdx + 1, s.p, s.w, s.d, s.l, s.gf, s.ga, s.gf - s.ga, s.w * 3 + s.d]
            );
        }
        console.log('   ✓ Standings inserted');

        // ── 8. PLAYER STATISTICS ─────────────────────────────────────────────
        console.log('\n🥅 Inserting player statistics...');

        for (const ps of CHAMP_PLAYER_STATS) {
            const playerId = 12 + ps.tIdx * 11 + (ps.jersey - 1);
            await conn.execute(
                `INSERT INTO player_statistics (tournament_id, player_id, team_id, goals, assists, matches_played)
                 VALUES (3, ?, ?, ?, ?, 3)`,
                [playerId, ps.tIdx + 1, ps.goals, ps.assists]
            );
        }

        for (const ps of LEAGUE_PLAYER_STATS) {
            const playerId = 12 + ps.tIdx * 11 + (ps.jersey - 1);
            await conn.execute(
                `INSERT INTO player_statistics (tournament_id, player_id, team_id, goals, assists, matches_played)
                 VALUES (1, ?, ?, ?, ?, 4)`,
                [playerId, ps.tIdx + 1, ps.goals, ps.assists]
            );
        }
        console.log('   ✓ Player statistics inserted');

        // ── 9. MATCH EVENTS ──────────────────────────────────────────────────
        console.log('\n⚡ Inserting match events...');

        for (const e of MATCH_EVENTS) {
            await conn.execute(
                `INSERT INTO match_events (match_id, team_id, player_id, event_type, minute, is_own_goal, assist_player_id)
                 VALUES (?, ?, ?, 'goal', ?, 0, ?)`,
                [e.mid, e.tid, e.pid, e.min, e.apid]
            );
        }
        console.log(`   ✓ ${MATCH_EVENTS.length} match events inserted`);

        // ── DONE ─────────────────────────────────────────────────────────────
        console.log('\n✅ SEED COMPLETE!\n');
        console.log('📌 Login credentials:');
        console.log('   Admin      : admin@11unity.com        / admin123');
        console.log('   Organizer1 : organizer1@11unity.am    / password123  (League + Championship)');
        console.log('   Organizer2 : organizer2@11unity.am    / password123  (Armenia Cup)');
        console.log('   Coach 1    : coach1@11unity.am        / password123  (FC Ararat-Armenia)');
        console.log('   Player 1   : araplayer1@11unity.am    / password123');
        console.log('\n🏆 Tournaments:');
        console.log('   1. Armenian Premier League 2025/26  [active   - league        - 8 teams]');
        console.log('   2. Armenia Cup 2026                 [upcoming - playoff        - 4 teams]');
        console.log('   3. Armenian Championship 2025       [finished - group+playoff  - 8 teams]');
        console.log('\n🥇 Championship 2025 winner: FC Ararat-Armenia\n');

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        throw err;
    } finally {
        await conn.end();
    }
}

seed();
