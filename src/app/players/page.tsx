import prisma from '@/lib/prisma'
import { PlayerClient } from '@/components/PlayerClient'

export const dynamic = 'force-dynamic'

export default async function PlayersPage(props: { searchParams: Promise<{ year?: string }> }) {
    const searchParams = await props.searchParams;
    const yearQuery = searchParams.year || new Date().getFullYear().toString()
    const isAll = yearQuery === 'ALL'
    const thisYear = isAll ? null : parseInt(yearQuery, 10)

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            attendances: {
                include: { match: true }
            }
        }
    })

    const matchesCountThisYear = isAll ? await prisma.match.count() : await prisma.match.count({
        where: {
            date: {
                gte: new Date(`${thisYear}-01-01T00:00:00.000Z`),
                lte: new Date(`${thisYear}-12-31T23:59:59.999Z`)
            }
        }
    })

    // Calculate this year's attendance rate and stats
    const playersWithStats = users.map(user => {
        const targetAttendances = isAll
            ? user.attendances
            : user.attendances.filter(a => a.match.date.getFullYear() === thisYear)
        const attendedCount = targetAttendances.length

        const rate = matchesCountThisYear > 0 ? Math.round((attendedCount / matchesCountThisYear) * 100) : 0
        const yearlyGoals = targetAttendances.reduce((acc, a) => acc + (a.goals || 0), 0)
        const yearlyAssists = targetAttendances.reduce((acc, a) => acc + (a.assists || 0), 0)

        return {
            ...user,
            attendanceRate: `${rate}%`,
            yearlyAppearances: attendedCount,
            yearlyGoals,
            yearlyAssists
        }
    })

    // Sort players by jersey number (ascending)
    playersWithStats.sort((a, b) => {
        const parseA = parseInt(a.jerseyNumber || '', 10)
        const parseB = parseInt(b.jerseyNumber || '', 10)
        const numA = isNaN(parseA) ? 9999 : parseA
        const numB = isNaN(parseB) ? 9999 : parseB

        if (numA !== numB) {
            return numA - numB
        }
        // Fallback to name or default sorting if numbers are equal/missing
        return a.name.localeCompare(b.name)
    })

    return (
        <PlayerClient initialPlayers={playersWithStats} currentYear={yearQuery} />
    )
}
