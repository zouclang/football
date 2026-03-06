const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'prisma', 'dev.db');
const uploadsDir = path.join(__dirname, 'public', 'uploads');

async function migrate() {
    console.log('Starting avatar migration...');
    const db = new Database(dbPath);

    // Ensure uploads directory exists
    try {
        await fs.access(uploadsDir);
    } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
        console.log('Created uploads directory');
    }

    const users = db.prepare(`SELECT id, name, profilePhoto FROM User WHERE profilePhoto LIKE 'data:image/%'`).all();
    console.log(`Found ${users.length} users with legacy base64 profile photos.`);

    const updateStmt = db.prepare(`UPDATE User SET profilePhoto = ? WHERE id = ?`);

    let successCount = 0;
    for (const user of users) {
        try {
            const matches = user.profilePhoto.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (!matches) {
                console.warn(`Could not parse base64 for user ${user.name} (${user.id})`);
                continue;
            }

            const ext = matches[1];
            const base64Data = matches[2];

            const fileName = `${randomUUID()}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);

            // Decode and write
            const buffer = Buffer.from(base64Data, 'base64');
            await fs.writeFile(filePath, buffer);

            const newUrl = `/uploads/${fileName}`;

            // Update DB
            updateStmt.run(newUrl, user.id);
            console.log(`Migrated ${user.name} -> ${newUrl} (${(buffer.length / 1024).toFixed(1)} KB)`);
            successCount++;
        } catch (e) {
            console.error(`Failed to migrate ${user.name}:`, e.message);
        }
    }

    console.log(`Migration complete! Successfully migrated ${successCount}/${users.length} avatars.`);
    db.close();
}

migrate().catch(console.error);
