import prisma from '@/lib/prisma'
import { getPlayerScores } from '@/lib/actions/player-score'
import { LeaderboardClient } from '@/components/LeaderboardClient'

export const dynamic = 'force-dynamic'

export default async function LeaderboardPage(props: { searchParams: Promise<{ year?: string }> }) {
    const searchParams = await props.searchParams
    const currentYearStr = new Date().getFullYear().toString()
    const yearQuery = searchParams.year || currentYearStr
    const isAll = yearQuery === 'ALL'
    const isBefore2026 = yearQuery === 'BEFORE_2026'
    const thisYear = (isAll || isBefore2026) ? null : parseInt(yearQuery, 10)

    const [users, scores] = await Promise.all([
        prisma.user.findMany({
            where: { isActive: true },
            select: { id: true, name: true, profilePhoto: true }
        }),
        getPlayerScores()
    ])

    const leaderboardData = users.map(user => {
        const userScoreDetails = scores[user.id]?.details || []
        
        // Filter by year
        const filteredDetails = userScoreDetails.filter(d => {
            if (isAll) return true;
            if (!d.date) return false;
            if (isBefore2026) return new Date(d.date).getUTCFullYear() < 2026;
            return new Date(d.date).getUTCFullYear() === thisYear;
        })

        // Accumulate by ruleKey
        const breakdown = {
            LEAGUE_ATTENDANCE: 0,
            LEAGUE_GOAL: 0,
            LEAGUE_ASSIST: 0,
            WINNING_GK: 0,
            FRIENDLY_ATTENDANCE: 0,
            LATE: 0,
            DROP_IN: 0,
            NO_SHOW: 0
        }

        let total = 0;

        filteredDetails.forEach(d => {
            total += d.points;
            if (d.ruleKey in breakdown) {
                breakdown[d.ruleKey as keyof typeof breakdown] += d.points;
            }
        })

        return {
            id: user.id,
            name: user.name,
            profilePhoto: user.profilePhoto,
            total,
            breakdown
        }
    })

    // Sort by total desc
    leaderboardData.sort((a, b) => b.total - a.total)

    return (
        <LeaderboardClient data={leaderboardData} currentYear={yearQuery} />
    )
}
