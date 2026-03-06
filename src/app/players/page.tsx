import { getDb } from '@/lib/sqlite'
import { PlayerClient } from '@/components/PlayerClient'
import { getSession } from '@/lib/auth'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function PlayersPage(props: { searchParams: Promise<{ year?: string }> }) {
    const session = await getSession()
    const searchParams = await props.searchParams

    const yearQuery = searchParams.year || 'ALL'
    const isAll = yearQuery === 'ALL'
    const isBefore2026 = yearQuery === 'BEFORE_2026'
    const thisYear = (isAll || isBefore2026) ? null : parseInt(yearQuery, 10)

    const db = getDb()

    // 直接 SQL：better-sqlite3 同步执行，无 IPC 开销
    // Prisma 同等查询要 1.3-1.7s；这里 <5ms

    // 球员列表（照片现已改为 /uploads/ 相对路径 URL，不再是 Base64，不再有 SSR 负担）
    const users = db.prepare(`
        SELECT id, name, jerseyNumber, jerseySize, birthDate, enrollmentYear,
               major, teamRole, positions, personalBalance, profilePhoto,
               isActive, isRetired, isMember,
               historicalMatches, historicalGoals, historicalAssists, createdAt
        FROM "User"
        ORDER BY
            CASE WHEN jerseyNumber IS NULL OR jerseyNumber = '' THEN 1 ELSE 0 END,
            CAST(jerseyNumber AS INTEGER),
            name
    `).all() as any[]

    // 出勤聚合 SQL（带日期过滤）
    let statsRows: { userId: string; appearances: number; goals: number; assists: number }[] = []
    let totalMatchCount = 0

    if (!isBefore2026) {
        const dateFilterJoin = isAll
            ? `m.date >= '2026-01-01'`
            : `m.date >= '${thisYear}-01-01' AND m.date < '${thisYear! + 1}-01-01'`
        const dateFilterPlain = isAll
            ? `date >= '2026-01-01'`
            : `date >= '${thisYear}-01-01' AND date < '${thisYear! + 1}-01-01'`

        statsRows = db.prepare(`
            SELECT a.userId,
                   COUNT(DISTINCT a.matchId) AS appearances,
                   SUM(a.goals)              AS goals,
                   SUM(a.assists)            AS assists
            FROM "Attendance" a
            INNER JOIN "Match" m ON a.matchId = m.id
            WHERE ${dateFilterJoin}
            GROUP BY a.userId
        `).all() as any[]

        totalMatchCount = (db.prepare(`
            SELECT COUNT(*) as cnt FROM "Match"
            WHERE ${dateFilterPlain}
        `).get() as any)?.cnt ?? 0
    }

    // 构建 userId → 统计查找表
    const statsMap = new Map<string, typeof statsRows[0]>()
    for (const s of statsRows) statsMap.set(s.userId, s)

    // 合并
    const playersWithStats = users.map(user => {
        const stat = statsMap.get(user.id)
        const attendedCount = stat?.appearances ?? 0
        const yearlyGoals = stat?.goals ?? 0
        const yearlyAssists = stat?.assists ?? 0
        const rate = totalMatchCount > 0 ? Math.round((attendedCount / totalMatchCount) * 100) : 0

        return {
            ...user,
            isActive: user.isActive === 1,
            isRetired: user.isRetired === 1,
            isMember: user.isMember === 1,
            attendanceRate: `${rate}%`,
            yearlyAppearances: attendedCount,
            yearlyGoals,
            yearlyAssists,
        } as any
    })

    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">加载中...</div>}>
            <PlayerClient initialPlayers={playersWithStats} currentYear={yearQuery} role={session?.role || 'player'} currentPlayerId={session?.playerId} />
        </Suspense>
    )
}
