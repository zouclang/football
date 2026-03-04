import prisma from '@/lib/prisma'
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

    // 日期过滤条件
    const dateFilterJoin = isBefore2026
        ? `m.date < '2026-01-01'`
        : isAll
            ? `m.date >= '2026-01-01'`
            : `m.date >= '${thisYear}-01-01' AND m.date < '${thisYear! + 1}-01-01'`
    const dateFilterPlain = isBefore2026
        ? `date < '2026-01-01'`
        : isAll
            ? `date >= '2026-01-01'`
            : `date >= '${thisYear}-01-01' AND date < '${thisYear! + 1}-01-01'`

    type AttendanceStat = { userId: string; appearances: bigint; goals: bigint; assists: bigint }

    const [statsRows, users, totalMatchCount] = await Promise.all([
        // 单条 JOIN SQL 聚合出勤统计（避免 N+1 查询）
        isBefore2026
            ? Promise.resolve([] as AttendanceStat[])
            : prisma.$queryRawUnsafe<AttendanceStat[]>(`
                SELECT a.userId,
                       COUNT(DISTINCT a.matchId) AS appearances,
                       SUM(a.goals)              AS goals,
                       SUM(a.assists)            AS assists
                FROM "Attendance" a
                INNER JOIN "Match" m ON a.matchId = m.id
                WHERE ${dateFilterJoin}
                GROUP BY a.userId
              `),
        // 球员列表（不含 profilePhoto — 每人 1-3MB 会使 SSR payload 膨胀）
        prisma.user.findMany({
            orderBy: [{ jerseyNumber: 'asc' }],
            select: {
                id: true, name: true,
                jerseyNumber: true, jerseySize: true,
                birthDate: true, enrollmentYear: true,
                major: true, teamRole: true, positions: true,
                personalBalance: true,
                isActive: true, isRetired: true, isMember: true,
                historicalMatches: true, historicalGoals: true, historicalAssists: true,
                createdAt: true,
            }
        }),
        // 总场数（作为出勤率分母）
        isBefore2026
            ? Promise.resolve(0)
            : prisma.$queryRawUnsafe<[{ cnt: bigint }]>(
                `SELECT COUNT(*) as cnt FROM "Match" WHERE ${dateFilterPlain}`
            ).then(r => Number(r[0]?.cnt ?? 0)),
    ])

    const statsMap = new Map<string, AttendanceStat>()
    for (const s of statsRows) statsMap.set(s.userId, s)

    const playersWithStats = users.map(user => {
        const stat = statsMap.get(user.id)
        const attendedCount = stat ? Number(stat.appearances) : 0
        const yearlyGoals = stat ? Number(stat.goals) : 0
        const yearlyAssists = stat ? Number(stat.assists) : 0
        const rate = totalMatchCount > 0
            ? Math.round((attendedCount / totalMatchCount) * 100) : 0
        return { ...user, attendanceRate: `${rate}%`, yearlyAppearances: attendedCount, yearlyGoals, yearlyAssists } as any
    })

    // 按球衣号码排序（兜底）
    playersWithStats.sort((a, b) => {
        const numA = parseInt(a.jerseyNumber || '', 10)
        const numB = parseInt(b.jerseyNumber || '', 10)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        if (!isNaN(numA)) return -1
        if (!isNaN(numB)) return 1
        return a.name.localeCompare(b.name)
    })

    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">加载中...</div>}>
            <PlayerClient initialPlayers={playersWithStats} currentYear={yearQuery} role={session?.role || 'player'} currentPlayerId={session?.playerId} />
        </Suspense>
    )
}
