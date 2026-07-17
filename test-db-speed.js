const { join } = require('path');
const Database = require('better-sqlite3');

const dbPath = join('/Users/zoucl', 'football', 'prisma', 'dev.db');
const db = new Database(dbPath, { readonly: true });

const start = Date.now();
for (let i = 0; i < 100; i++) {
    db.prepare(`
        SELECT id, name, jerseyNumber, jerseySize, birthDate, enrollmentYear,
               major, teamRole, positions, personalBalance, profilePhoto,
               isActive, isRetired, isMember,
               historicalMatches, historicalGoals, historicalAssists, createdAt
        FROM "User"
    `).all();
}
console.log('100 User Queries took:', Date.now() - start, 'ms');

const start2 = Date.now();
for (let i = 0; i < 100; i++) {
    db.prepare(`
        SELECT a.userId,
               COUNT(DISTINCT a.matchId) AS appearances,
               SUM(a.goals)              AS goals,
               SUM(a.assists)            AS assists
        FROM "Attendance" a
        INNER JOIN "Match" m ON a.matchId = m.id
        WHERE m.date >= '2026-01-01'
        GROUP BY a.userId
    `).all();
}
console.log('100 Attendance JOIN Queries took:', Date.now() - start2, 'ms');
