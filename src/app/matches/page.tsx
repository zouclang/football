import prisma from '@/lib/prisma'
import { MatchClient } from '@/components/MatchClient'

export const dynamic = 'force-dynamic'

export default async function MatchesPage(props: { searchParams: Promise<{ tournamentId?: string, editMatchId?: string, year?: string, opponent?: string }> }) {
    const { tournamentId, editMatchId, year, opponent } = await props.searchParams

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
    if (year && year !== 'ALL') {
        const y = parseInt(year)
        where.date = {
            gte: new Date(y, 0, 1),
            lt: new Date(y + 1, 0, 1)
        }
    }

    const [matches, players, unfinishedTournaments, filterTournament, allTournaments] = await Promise.all([
        prisma.match.findMany({
            where,
            orderBy: { date: 'desc' },
            include: { attendances: true }
        }),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
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
        />
    )
}
