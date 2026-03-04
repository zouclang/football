import prisma from '@/lib/prisma'
import { MatchClient } from '@/components/MatchClient'
import { getSession } from '@/lib/auth'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

export default async function MatchesPage(props: { searchParams: Promise<{ tournamentId?: string, editMatchId?: string, year?: string, opponent?: string, page?: string, pageSize?: string }> }) {
    const session = await getSession()
    const { tournamentId, editMatchId, year, opponent, page, pageSize } = await props.searchParams

    const yearVal = year || 'ALL'
    const currentPage = Math.max(1, parseInt(page || '1', 10))
    const pageSizeVal = Math.min(100, Math.max(5, parseInt(pageSize || '10', 10)))

    // 构建动态过滤条件
    const where: any = {}
    if (tournamentId) {
        if (tournamentId === 'FRIENDLY') {
            where.type = 'FRIENDLY'
        } else {
            where.tournamentId = tournamentId
        }
    }
    if (opponent) where.opponent = { contains: opponent }
    if (yearVal !== 'ALL') {
        if (yearVal === 'BEFORE_2026') {
            where.date = { lt: new Date('2026-01-01T00:00:00.000Z') }
        } else {
            const y = parseInt(yearVal)
            where.date = {
                gte: new Date(y, 0, 1),
                lt: new Date(y + 1, 0, 1)
            }
        }
    }

    const [totalCount, matches, players, unfinishedTournaments, filterTournament, allTournaments] = await Promise.all([
        // 总数用于分页控件
        prisma.match.count({ where }),
        // 只取当前页的数据（走索引 + LIMIT/OFFSET）
        prisma.match.findMany({
            where,
            orderBy: { date: 'desc' },
            take: pageSizeVal,
            skip: (currentPage - 1) * pageSizeVal,
            include: {
                // 只取考勤所需字段，不取 id/createdAt
                attendances: {
                    select: { userId: true, goals: true, assists: true, fee: true }
                }
            }
        }),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, jerseyNumber: true, profilePhoto: true, isActive: true, isRetired: true, isMember: true }
        }),
        // ⚡ 不再包含 players — 曾是 300ms 的主要瓶颈
        // 球员白名单改为弹窗打开时通过 getTournamentPlayers() 按需加载
        prisma.tournament.findMany({
            where: { finalRank: null },
            select: { id: true, name: true, startDate: true, endDate: true },
            orderBy: { createdAt: 'desc' }
        }),
        tournamentId ? prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true, name: true } }) : null,
        prisma.tournament.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true } })
    ])


    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">加载中...</div>}>
            <MatchClient
                initialMatches={matches}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSizeVal}
                players={players}
                unfinishedTournaments={unfinishedTournaments}
                filterTournamentName={filterTournament?.name}
                autoEditMatchId={editMatchId}
                allTournaments={allTournaments}
                role={session?.role || 'player'}
            />
        </Suspense>
    )
}
