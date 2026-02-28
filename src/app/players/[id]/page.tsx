import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { PlayerProfileClient } from '@/components/PlayerProfileClient'

export const dynamic = 'force-dynamic'

export default async function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const player = await prisma.user.findUnique({
        where: { id: id },
        include: {
            attendances: {
                include: { match: true },
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

    const totalMatches = await prisma.match.count()

    if (!player) {
        notFound()
    }

    return <PlayerProfileClient player={player} totalMatches={totalMatches} />
}
