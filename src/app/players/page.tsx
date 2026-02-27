import prisma from '@/lib/prisma'
import { PlayerClient } from '@/components/PlayerClient'

export const dynamic = 'force-dynamic'

export default async function PlayersPage() {
    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            attendances: true
        }
    })

    const matchesCount = await prisma.match.count()

    // Calculate attendance rate
    const playersWithStats = users.map(user => {
        const attendedCount = user.attendances.length
        const rate = matchesCount > 0 ? Math.round((attendedCount / matchesCount) * 100) : 0
        return {
            ...user,
            attendanceRate: `${rate}%`
        }
    })

    return (
        <PlayerClient initialPlayers={playersWithStats} />
    )
}
