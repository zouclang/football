import prisma from '@/lib/prisma'
import { PlayerClient } from '@/components/PlayerClient'
import { getSession } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function PlayersPage(props: { searchParams: Promise<{ year?: string }> }) {
    const session = await getSession()
    const searchParams = await props.searchParams;

    const yearQuery = searchParams.year || 'ALL'
    const isAll = yearQuery === 'ALL'
    const isBefore2026 = yearQuery === 'BEFORE_2026'
    const thisYear = (isAll || isBefore2026) ? null : parseInt(yearQuery, 10)

    const users = await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
            id: true,
            name: true,
            jerseyNumber: true,
            jerseySize: true,
            birthDate: true,
            enrollmentYear: true,
            major: true,
            teamRole: true,
            positions: true,
            profilePhoto: true,
            personalBalance: true,
            isActive: true,
            isRetired: true,
            isMember: true,
            historicalMatches: true,
            historicalGoals: true,
            historicalAssists: true,
            createdAt: true,
            // Only load attendances relevant to the requested year — avoids pulling all history
            attendances: {
                where: thisYear ? {
                    match: {
                        date: {
                            gte: new Date(`${thisYear}-01-01T00:00:00.000Z`),
                            lte: new Date(`${thisYear}-12-31T23:59:59.999Z`)
                        }
                    }
                } : isAll ? {
                    match: { date: { gte: new Date('2026-01-01T00:00:00.000Z') } }
                } : undefined, // BEFORE_2026: no current-year attendances needed
                select: {
                    goals: true,
                    assists: true,
                    match: { select: { date: true } }
                }
            }
        }
    })

    const matchesCountThisYear = isBefore2026
        ? 0
        : await prisma.match.count({
            where: isAll ? {
                date: {
                    gte: new Date(`2026-01-01T00:00:00.000Z`)
                }
            } : {
                date: {
                    gte: new Date(`${thisYear}-01-01T00:00:00.000Z`),
                    lte: new Date(`${thisYear}-12-31T23:59:59.999Z`)
                }
            }
        })

    // Calculate this year's attendance rate and stats
    const playersWithStats = users.map(user => {
        const targetAttendances = isAll
            ? user.attendances.filter(a => a.match.date.getFullYear() >= 2026)
            : isBefore2026
                ? []
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
            yearlyAssists,
            historicalMatches: (user as any).historicalMatches || 0,
            historicalGoals: (user as any).historicalGoals || 0,
            historicalAssists: (user as any).historicalAssists || 0
        } as any
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
        <PlayerClient initialPlayers={playersWithStats} currentYear={yearQuery} role={session?.role || 'player'} currentPlayerId={session?.playerId} />
    )
}
