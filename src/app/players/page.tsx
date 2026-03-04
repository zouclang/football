import prisma from '@/lib/prisma'
import { PlayerClient } from '@/components/PlayerClient'
import { getSession } from '@/lib/auth'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function PlayersPage(props: { searchParams: Promise<{ year?: string }> }) {
    const session = await getSession()
    const searchParams = await props.searchParams;

    const yearQuery = searchParams.year || 'ALL'
    const isAll = yearQuery === 'ALL'
    const isBefore2026 = yearQuery === 'BEFORE_2026'
    const thisYear = (isAll || isBefore2026) ? null : parseInt(yearQuery, 10)

    // 用一条 JOIN SQL 直接算出每个球员的出勤/进球/助攻
    // 相比"先取所有 matchId，再用 IN 参数传入 aggregate SQL"，JOIN 更高效
    const dateFilter = isBefore2026
        ? `m.date < '2026-01-01'`
        : isAll
            ? `m.date >= '2026-01-01'`
            : `m.date >= '${thisYear}-01-01' AND m.date <= '${thisYear}-12-31 23:59:59'`

    type AttendanceStat = { userId: string; appearances: bigint; goals: bigint; assists: bigint; matchCount: bigint }

    const [statsRows, users] = await Promise.all([
        // 单条 SQL：JOIN Match 过滤日期，GROUP BY userId 聚合
        isBefore2026
            ? Promise.resolve([] as AttendanceStat[])   // 2026前无需统计出勤
            : prisma.$queryRawUnsafe<AttendanceStat[]>(`
                SELECT a.userId,
                       COUNT(DISTINCT a.matchId) AS appearances,
                       SUM(a.goals)              AS goals,
                       SUM(a.assists)            AS assists,
                       COUNT(DISTINCT m.id)      AS matchCount
                FROM "Attendance" a
                INNER JOIN "Match" m ON a.matchId = m.id
                WHERE ${dateFilter}
                GROUP BY a.userId
              `),
        prisma.user.findMany({
            orderBy: { jerseyNumber: 'asc' },
            select: {
                id: true, name: true,
                jerseyNumber: true, jerseySize: true,
                birthDate: true, enrollmentYear: true,
                major: true, teamRole: true, positions: true,
                profilePhoto: true, personalBalance: true,
                isActive: true, isRetired: true, isMember: true,
                historicalMatches: true, historicalGoals: true, historicalAssists: true,
                createdAt: true,
            }
        })
    ])

    // 需要独立查总比赛数（作为出勤率分母）
    const totalMatchCount: number = isBefore2026 ? 0
        : statsRows.length > 0
            // matchCount 每行都是该用户参加场次，但总场次需单独查
            ? await prisma.match.count({
                where: isAll
                    ? { date: { gte: new Date('2026-01-01') } }
                    : { date: { gte: new Date(`${thisYear}-01-01`), lt: new Date(`${thisYear! + 1}-01-01`) } }
            })
            : 0

    // 构建 userId → 统计的快速查找表
    const statsMap = new Map<string, AttendanceStat>()
    for (const s of statsRows) statsMap.set(s.userId, s)

    // 合并统计到用户列表
    const playersWithStats = users.map(user => {
        const stat = statsMap.get(user.id)
        const attendedCount = stat ? Number(stat.appearances) : 0
        const yearlyGoals = stat ? Number(stat.goals) : 0
        const yearlyAssists = stat ? Number(stat.assists) : 0
        const rate = totalMatchCount > 0
            ? Math.round((attendedCount / totalMatchCount) * 100) : 0

        return { ...user, attendanceRate: `${rate}%`, yearlyAppearances: attendedCount, yearlyGoals, yearlyAssists } as any
    })

    // 按球衣号码排序（已在DB侧排过，这里只处理无号码的兜底）
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
