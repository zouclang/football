import prisma from '@/lib/prisma'
import { MatchClient } from '@/components/MatchClient'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function MatchesPage(props: { searchParams: Promise<{ tournamentId?: string, editMatchId?: string, year?: string, opponent?: string }> }) {
    const session = await getSession()
    const { tournamentId, editMatchId, year, opponent } = await props.searchParams

    const yearVal = year || 'ALL'

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
            where.date = {
                lt: new Date('2026-01-01T00:00:00.000Z')
            }
        } else {
            const y = parseInt(yearVal)
            where.date = {
                gte: new Date(y, 0, 1),
                lt: new Date(y + 1, 0, 1)
            }
        }
    }

    const [matches, players, unfinishedTournaments, filterTournament, allTournaments] = await Promise.all([
        prisma.match.findMany({
            where,
            orderBy: { date: 'desc' },
            include: { attendances: true }
        }),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' },
            select: { id: true, name: true, jerseyNumber: true, profilePhoto: true, isActive: true, isRetired: true, isMember: true }
        }),
        prisma.tournament.findMany({
            where: { finalRank: null },
            include: { players: true },
            orderBy: { createdAt: 'desc' }
        }),
        tournamentId ? prisma.tournament.findUnique({ where: { id: tournamentId } }) : null,
        prisma.tournament.findMany({ orderBy: { createdAt: 'desc' } })
    ])

    return (
        <MatchClient
            initialMatches={matches}
            players={players}
            unfinishedTournaments={unfinishedTournaments}
            filterTournamentName={filterTournament?.name}
            autoEditMatchId={editMatchId}
            allTournaments={allTournaments}
            role={session?.role || 'player'}
        />
    )
}
