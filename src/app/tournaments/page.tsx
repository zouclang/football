import { getTournaments } from '@/lib/actions/tournament'
import prisma from '@/lib/prisma'
import { TournamentClient } from '@/components/TournamentClient'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function TournamentsPage() {
    const session = await getSession()
    const [tournaments, players] = await Promise.all([
        getTournaments(),
        prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, jerseyNumber: true, isActive: true, isRetired: true }
        })
    ])

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <TournamentClient initialTournaments={tournaments} players={players} role={session?.role || 'player'} />
        </main>
    )
}
