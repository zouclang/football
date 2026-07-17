import prisma from '@/lib/prisma'
import { FinanceClientLoader } from '@/components/FinanceClientLoader'
import { getDiningRecords } from '@/lib/actions/finance'
import { getMemberFundTransactions } from '@/lib/actions/memberFund'
import { getSession } from '@/lib/auth'
export const dynamic = 'force-dynamic'

export default async function FinancePage() {
    const session = await getSession()
    const [teamTransactions, personalTransactions, players, teamInfo] = await Promise.all([
        prisma.teamFundTransaction.findMany({
            orderBy: { date: 'desc' }
        }),
        prisma.personalTransaction.findMany({
            orderBy: { date: 'desc' },
            include: {
                user: {
                    select: {
                        id: true, name: true, jerseyNumber: true,
                        isActive: true, isRetired: true,
                        personalBalance: true, isMember: true
                    }
                }
            }
        }),
        prisma.user.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true, name: true, jerseyNumber: true,
                isActive: true, isRetired: true,
                personalBalance: true, isMember: true
            }
        }),
        prisma.teamInfo.findFirst(),
    ])

    const diningRecords = await getDiningRecords()
    const memberFundTransactions = await getMemberFundTransactions()

    // Fetch unique categories for auto-suggestions
    const uniqueIncomes = Array.from(new Set(teamTransactions.filter(t => t.transactionType === 'INCOME').map(t => t.category)))
    const uniqueExpenses = Array.from(new Set(teamTransactions.filter(t => t.transactionType === 'EXPENSE').map(t => t.category)))

    const teamBalance = teamTransactions.reduce((acc, t) =>
        t.transactionType === 'INCOME' ? acc + t.amount : acc - t.amount, 0
    )

    const memberFundBalance = memberFundTransactions.reduce((acc, t) =>
        t.type === 'INCOME' ? acc + t.totalAmount : acc - t.totalAmount, 0
    )

    return (
        <FinanceClientLoader
            teamTransactions={teamTransactions}
            personalTransactions={personalTransactions}
            players={players}
            teamBalance={teamBalance}
            leaderName={teamInfo?.leaderName || null}
            incomeCategories={uniqueIncomes}
            expenseCategories={uniqueExpenses}
            diningRecords={diningRecords}
            memberFundTransactions={memberFundTransactions}
            memberFundBalance={memberFundBalance}
            role={session?.role || 'player'}
        />
    )
}
