import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PlayerProfileClient } from '@/components/PlayerProfileClient'
import { getSession } from '@/lib/auth'
import { getPlayerScores } from '@/lib/actions/player-score'

export const dynamic = 'force-dynamic'

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getSession()
    const { id } = await params;
    const player = await prisma.user.findUnique({
        where: { id: id },
        include: {
            attendances: {
                include: {
                    match: {
                        include: { tournament: true }
                    }
                },
                orderBy: { match: { date: 'desc' } }
            },
            personalTransactions: {
                orderBy: { date: 'desc' }
            },
            memberTransactions: {
                orderBy: { date: 'desc' }
            }
        }
    })

    const scores = await getPlayerScores(id)
    const playerScore = scores[id] || { total: 0, details: [] }

    const matches = await prisma.match.findMany({ select: { date: true } })
    const matchCountsByYear: Record<string, number> = { 'ALL': matches.length }
    matches.forEach(m => {
        const y = m.date.getUTCFullYear().toString()
        matchCountsByYear[y] = (matchCountsByYear[y] || 0) + 1
    })

    if (!player) {
        notFound()
    }

    return <PlayerProfileClient player={player} matchCountsByYear={matchCountsByYear} role={session?.role || 'player'} currentPlayerId={session?.playerId} scoreData={playerScore} />
}
