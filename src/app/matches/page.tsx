import prisma from '@/lib/prisma'
import { MatchClient } from '@/components/MatchClient'

export const dynamic = 'force-dynamic'

export default async function MatchesPage() {
    const [matches, players] = await Promise.all([
        prisma.match.findMany({
            orderBy: { date: 'desc' },
            include: { attendances: true }
        }),
        prisma.user.findMany({
            orderBy: { createdAt: 'desc' }
        })
    ])

    return (
        <MatchClient initialMatches={matches} players={players} />
    )
}
