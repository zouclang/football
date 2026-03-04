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

    // 构建过滤条件
    type WhereClause = {
        tournamentId?: string
        type?: string
        opponent?: { contains: string }
        date?: { gte?: Date; lt?: Date }
    }
    const where: WhereClause = {}
    if (tournamentId === 'FRIENDLY') {
        where.type = 'FRIENDLY'
    } else if (tournamentId) {
        where.tournamentId = tournamentId
    }
    if (opponent) where.opponent = { contains: opponent }
    if (yearVal === 'BEFORE_2026') {
        where.date = { lt: new Date('2026-01-01') }
    } else if (yearVal !== 'ALL') {
        const y = parseInt(yearVal)
        where.date = { gte: new Date(`${y}-01-01`), lt: new Date(`${y + 1}-01-01`) }
    }

    const [totalCount, matches, players, unfinishedTournaments, filterTournament, allTournaments] = await Promise.all([
        prisma.match.count({ where }),
        prisma.match.findMany({
            where,
            orderBy: { date: 'desc' },
            take: pageSizeVal,
            skip: (currentPage - 1) * pageSizeVal,
            include: {
                attendances: {
                    select: { userId: true, goals: true, assists: true, fee: true }
                }
            }
        }),
        // 不含 profilePhoto（每人 1-3MB，会使 SSR payload 膨胀至 100MB+）
        prisma.user.findMany({
            orderBy: { jerseyNumber: 'asc' },
            select: { id: true, name: true, jerseyNumber: true, isActive: true, isRetired: true, isMember: true }
        }),
        // 未完结赛事（球员白名单延迟加载，不在此处拉取）
        prisma.tournament.findMany({
            where: { finalRank: null },
            select: { id: true, name: true, startDate: true, endDate: true },
            orderBy: { createdAt: 'desc' }
        }),
        tournamentId && tournamentId !== 'FRIENDLY'
            ? prisma.tournament.findUnique({ where: { id: tournamentId }, select: { id: true, name: true } })
            : Promise.resolve(null),
        prisma.tournament.findMany({ orderBy: { createdAt: 'desc' }, select: { id: true, name: true } })
    ])

    return (
        <Suspense fallback={<div className="flex items-center justify-center h-64 text-slate-400 animate-pulse">加载中...</div>}>
            <MatchClient
                initialMatches={matches as any}
                totalCount={totalCount}
                currentPage={currentPage}
                pageSize={pageSizeVal}
                players={players as any}
                unfinishedTournaments={unfinishedTournaments as any}
                filterTournamentName={filterTournament?.name}
                autoEditMatchId={editMatchId}
                allTournaments={allTournaments as any}
                role={session?.role || 'player'}
            />
        </Suspense>
    )
}
