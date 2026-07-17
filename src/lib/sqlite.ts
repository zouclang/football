/**
 * 直接 SQLite 访问层（绕过 Prisma Rust 二进制引擎）
 *
 * 问题背景：
 * Prisma 使用一个独立的 Rust 进程作为查询引擎，Node.js 通过 IPC 与其通信。
 * 即使是最简单的 SELECT，这个序列化/反序列化 + IPC 往返也要消耗 1-2 秒。
 *
 * 解决方案：
 * 对于只读的热路径查询（球员列表、考勤统计），使用 better-sqlite3
 * 直接在 Node.js 进程内同步访问 SQLite，完全消除 IPC 开销。
 * 写操作（增/改/删）仍通过 Prisma 以保证类型安全。
 */

import Database from 'better-sqlite3'
import path from 'path'

// 从 DATABASE_URL 解析 SQLite 文件路径
function getDbPath(): string {
    const url = process.env.DATABASE_URL || ''
    // 支持 "file:/absolute/path/dev.db" 和 "file:./relative/dev.db"
    const match = url.match(/^file:(.+)$/)
    if (match) {
        const p = match[1]
        return path.isAbsolute(p) ? p : path.resolve(process.cwd(), p)
    }
    throw new Error(`无法从 DATABASE_URL 解析 SQLite 路径: ${url}`)
}

let _db: Database.Database | null = null

export function getDb(): Database.Database {
    // 检查 open 状态：若连接已关闭或崩溃则重新创建
    if (!_db || !_db.open) {
        _db = new Database(getDbPath(), { readonly: true })
        // 性能优化：WAL + 内存缓存
        _db.pragma('journal_mode = WAL')
        _db.pragma('cache_size = -32000')
        _db.pragma('synchronous = NORMAL')
        _db.pragma('temp_store = MEMORY')
    }
    return _db
}
