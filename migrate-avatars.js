const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const Database = require('better-sqlite3');

// 自动寻找正确的数据库路径
let dbPath = path.join(__dirname, 'prisma', 'dev.db'); // 默认本地路径

try {
    // 尝试读取 .env 文件中的 DATABASE_URL
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const match = envContent.match(/DATABASE_URL="?file:([^"\n]+)"?/);
        if (match && match[1]) {
            let envDbPath = match[1];
            // 如果是绝对路径则直接使用，如果是相对路径则与 __dirname 拼接
            if (path.isAbsolute(envDbPath)) {
                dbPath = envDbPath;
            } else {
                dbPath = path.join(__dirname, 'prisma', envDbPath);
            }
            console.log('✅ 从 .env 读取到数据库路径:', dbPath);
        }
    }
} catch (e) {
    console.warn('⚠️ 读取 .env 失败，将使用默认数据库路径:', dbPath);
}

// 确保数据库文件真的存在，防止 better-sqlite3 自动创建一个空库
if (!fs.existsSync(dbPath)) {
    console.error(`❌ 致命错误: 找不到数据库文件 -> ${dbPath}`);
    console.error('请确保你在 football 项目根目录下运行此脚本，且 .env 文件配置正确。');
    process.exit(1);
}

const uploadsDir = path.join(__dirname, 'public', 'uploads');

async function migrate() {
    console.log(`🚀 开始扫描数据库: ${dbPath}`);
    const db = new Database(dbPath);

    // 尝试找 User 表
    try {
        const checkTable = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='User'`).get();
        if (!checkTable) {
            console.error(`❌ 数据库中没有找到 User 表！这可能是一个新创建的空数据库，或者你连接错了数据库。`);
            process.exit(1);
        }
    } catch (e) {
        console.error('检查表失败:', e.message);
        process.exit(1);
    }

    try {
        await fsPromises.access(uploadsDir);
    } catch {
        await fsPromises.mkdir(uploadsDir, { recursive: true });
        console.log('✅ 自动创建了 uploads 文件夹:', uploadsDir);
    }

    // SQLite 中表名如果是 User 最好带上双引号 "User"
    const users = db.prepare(`SELECT id, name, profilePhoto FROM "User" WHERE profilePhoto LIKE 'data:image/%'`).all();

    if (users.length === 0) {
        console.log('✨ 恭喜：你的数据库非常纯净，没有任何遗留的 Base64 乱码老照片需要迁移！');
        db.close();
        return;
    }

    console.log(`🔍 发现了 ${users.length} 个体内残留 Base64 毒素的球员，开始执行切割手术...`);

    const updateStmt = db.prepare(`UPDATE "User" SET profilePhoto = ? WHERE id = ?`);

    let successCount = 0;
    for (const user of users) {
        try {
            const matches = user.profilePhoto.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
            if (!matches) {
                console.warn(`[跳过] 无法解析 Base64: ${user.name}`);
                continue;
            }

            const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
            const base64Data = matches[2];

            const fileName = `${randomUUID()}.${ext}`;
            const filePath = path.join(uploadsDir, fileName);

            // 写入成真实的物理图片文件
            const buffer = Buffer.from(base64Data, 'base64');
            await fsPromises.writeFile(filePath, buffer);

            const newUrl = `/uploads/${fileName}`;

            // 把数据库里的几兆毒素乱码替换成短小的路径文本
            updateStmt.run(newUrl, user.id);
            console.log(`✅ 成功治愈 ${user.name} -> 提取出 ${(buffer.length / 1024).toFixed(1)} KB 头像`);
            successCount++;
        } catch (e) {
            console.error(`❌ 治愈 ${user.name} 失败:`, e.message);
        }
    }

    console.log(`🎉 任务圆满完成！成功拯救了 ${successCount}/${users.length} 个头像。`);
    db.close();
}

migrate().catch(console.error);
