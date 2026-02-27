import { getTeamInfo } from '@/lib/actions/team'
import { TeamClient } from '@/components/TeamClient'

export const dynamic = 'force-dynamic'

export default async function TeamPage() {
    const teamInfo = await getTeamInfo()

    return (
        <TeamClient initialData={teamInfo} />
    )
}
