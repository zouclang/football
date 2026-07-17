const { join } = require('path');
const Database = require('better-sqlite3');

const dbPath = join('/Users/zoucl', 'football', 'prisma', 'dev.db');
const db = new Database(dbPath, { readonly: true });

const sum = db.prepare('SELECT SUM(LENGTH(profilePhoto)) as total FROM User').get();
const max = db.prepare('SELECT MAX(LENGTH(profilePhoto)) as max, id, name FROM User').get();
console.log('Total profilePhoto bytes in DB:', sum.total);
console.log('Max profilePhoto bytes in DB:', max);
