import { getTeamInfo } from '@/lib/actions/team'
import { TeamClient } from '@/components/TeamClient'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const runtime = 'edge'

export default async function TeamPage() {
    const teamInfo = await getTeamInfo()
    const players = await prisma.user.findMany({
        orderBy: { name: 'asc' }
    })

    return (
        <div className="space-y-6">
            <TeamClient initialData={teamInfo || {}} players={players} />
        </div>
    )
}
