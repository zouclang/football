import prisma from '@/lib/prisma'
import { FinanceClient } from '@/components/FinanceClient'

export const dynamic = 'force-dynamic'

export default async function FinancePage() {
    // #3: 一次性拿回 teamTransactions，不再重复调 getTeamFundBalance()（其内部会再做一次查询）
    const [teamTransactions, personalTransactions, players] = await Promise.all([
        prisma.teamFundTransaction.findMany({
            orderBy: { createdAt: 'desc' }
        }),
        prisma.personalTransaction.findMany({
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        }),
        prisma.user.findMany({
            orderBy: { name: 'asc' }
        }),
    ])

    // #3: 直接在内存中计算，避免额外一次数据库请求
    const teamBalance = teamTransactions.reduce((acc, t) =>
        t.transactionType === 'INCOME' ? acc + t.amount : acc - t.amount, 0
    )

    return (
        <FinanceClient
            teamTransactions={teamTransactions}
            personalTransactions={personalTransactions}
            players={players}
            teamBalance={teamBalance}
        />
    )
}
