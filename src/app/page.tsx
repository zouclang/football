import prisma from '@/lib/prisma'
import { Trophy, Users, DollarSign, Activity } from 'lucide-react'
import { DashboardCharts } from '@/components/DashboardCharts'
import { DashboardFinanceChartClient } from '@/components/DashboardFinanceChartClient'
import { DashboardLeaderboardClient } from '@/components/DashboardLeaderboardClient'
import { DashboardYearSelector } from '@/components/DashboardYearSelector'
// #8: 改用统一的 cn()，删除本文件内的重复定义
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage(props: { searchParams: Promise<{ year?: string }> }) {
  const resolvedParams = await props.searchParams
  const year = resolvedParams.year || 'ALL'
  const isAll = year === 'ALL'
  const isBefore2026 = year === 'BEFORE_2026'

  // Fetch high-level stats — select only the columns needed; avoids loading
  // profilePhoto / proof URLs / major / etc. into memory.
  const [
    playerCount,
    matchCount,
    transactions,
    personalTransactions,
    attendances,
    users,
    memberFundTxs
  ] = await Promise.all([
    prisma.user.count(),
    prisma.match.count({
      where: (isAll || isBefore2026) ? {} : {
        date: {
          gte: new Date(parseInt(year), 0, 1),
          lt: new Date(parseInt(year) + 1, 0, 1)
        }
      }
    }),
    prisma.teamFundTransaction.findMany({
      select: { id: true, amount: true, transactionType: true, category: true, date: true }
    }),
    prisma.personalTransaction.findMany({
      select: { id: true, userId: true, amount: true }
    }),
    prisma.attendance.findMany({
      select: { userId: true, goals: true, assists: true, match: { select: { date: true } } }
    }),
    prisma.user.findMany({
      select: {
        id: true, name: true,
        historicalMatches: true, historicalGoals: true, historicalAssists: true,
        personalBalance: true
      }
    }),
    prisma.memberFundTransaction.findMany({
      select: { id: true, type: true, totalAmount: true }
    })
  ])

  // Process Finances
  const teamFundBalance = transactions.reduce((acc, t) =>
    t.transactionType === 'INCOME' ? acc + t.amount : acc - t.amount
    , 0)

  const personalFundLiability = users.reduce((acc, u) => acc + u.personalBalance, 0)

  const memberFundBalance = memberFundTxs.reduce((acc, t) =>
    t.type === 'INCOME' ? acc + t.totalAmount : acc - t.totalAmount
    , 0)

  // Process Expenses for Chart
  const expenseCategories = transactions
    .filter(t => {
      if (t.transactionType !== 'EXPENSE') return false
      if (isAll) return true
      const txYear = new Date(t.date).getUTCFullYear()
      if (isBefore2026) return txYear < 2026
      return txYear.toString() === year
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const expenseData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }))

  // Process Incomes for Chart
  const incomeCategories = transactions
    .filter(t => {
      if (t.transactionType !== 'INCOME') return false
      if (isAll) return true
      const txYear = new Date(t.date).getUTCFullYear()
      if (isBefore2026) return txYear < 2026
      return txYear.toString() === year
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const incomeData = Object.entries(incomeCategories).map(([name, value]) => ({ name, value }))

  // Process Attendance Chart
  const filteredAttendances = (isAll || isBefore2026)
    ? (isBefore2026 ? [] : attendances)
    : attendances.filter(a => new Date(a.match.date).getUTCFullYear().toString() === year)

  const attendanceCounts = filteredAttendances.reduce((acc, a) => {
    acc[a.userId] = (acc[a.userId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // 累加历史数据 (仅在 "全部" 或 "2026之前" 模式下)
  if (isAll || isBefore2026) {
    users.forEach(u => {
      const user = u as any
      if (user.historicalMatches > 0) {
        attendanceCounts[u.id] = (attendanceCounts[u.id] || 0) + user.historicalMatches
      }
    })
  }

  const topAttendees = Object.entries(attendanceCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([userId, count]) => {
      const user = users.find(u => u.id === userId)
      return {
        name: user?.name || '未知',
        count
      }
    })

  // Process Goals Chart (Top 5 scorers)
  const goalCounts = filteredAttendances.reduce((acc, a) => {
    acc[a.userId] = (acc[a.userId] || 0) + (a.goals || 0)
    return acc
  }, {} as Record<string, number>)

  if (isAll || isBefore2026) {
    users.forEach(u => {
      const user = u as any
      if (user.historicalGoals > 0) {
        goalCounts[u.id] = (goalCounts[u.id] || 0) + user.historicalGoals
      }
    })
  }

  const topGoals = Object.entries(goalCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([userId, count]) => {
      const user = users.find(u => u.id === userId)
      return {
        name: user?.name || '未知',
        count
      }
    })

  // Process Assists Chart (Top 5 assisters)
  const assistCounts = filteredAttendances.reduce((acc, a) => {
    acc[a.userId] = (acc[a.userId] || 0) + (a.assists || 0)
    return acc
  }, {} as Record<string, number>)

  const topAssists = Object.entries(assistCounts)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([userId, count]) => {
      const user = users.find(u => u.id === userId)
      return {
        name: user?.name || '未知',
        count
      }
    })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">数据总览</h1>
        <DashboardYearSelector currentYear={year} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard
          title="在册球员"
          value={playerCount}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          subtitle="人"
        />
        <StatCard
          title="赞助费余额"
          value={`¥${teamFundBalance.toFixed(2)}`}
          icon={<Trophy className="h-6 w-6 text-emerald-500" />}
          subtitle="总计可用资金"
        />
        <StatCard
          title="会员费余额"
          value={`¥${memberFundBalance.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6 text-fuchsia-500" />}
          subtitle="充值会员会费留存"
          negative={memberFundBalance < 0}
        />
        <StatCard
          title="个人账户总留存"
          value={`¥${personalFundLiability.toFixed(2)}`}
          icon={<DollarSign className="h-6 w-6 text-indigo-500" />}
          subtitle={personalFundLiability < 0 ? "总欠款" : "总预存"}
          negative={personalFundLiability < 0}
        />
        <StatCard
          title="累计比赛"
          value={isBefore2026 ? '-' : matchCount}
          icon={<Activity className="h-6 w-6 text-orange-500" />}
          subtitle="场"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DashboardFinanceChartClient expenseData={expenseData} incomeData={incomeData} />

        <DashboardLeaderboardClient attendanceData={topAttendees} goalsData={topGoals} assistsData={topAssists} />
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, subtitle, negative = false }: { title: string, value: string | number, icon: React.ReactNode, subtitle?: string, negative?: boolean }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <p className={cn("text-2xl font-bold mt-2", negative ? "text-red-500" : "text-slate-900")}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="p-3 bg-slate-50 rounded-lg">
        {icon}
      </div>
    </div>
  )
}
