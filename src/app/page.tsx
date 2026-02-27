import prisma from '@/lib/prisma'
import { Trophy, Users, DollarSign, Activity } from 'lucide-react'
import { DashboardCharts } from '@/components/DashboardCharts'
// #8: 改用统一的 cn()，删除本文件内的重复定义
import { cn } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // Fetch high-level stats
  const [
    playerCount,
    matchCount,
    transactions,
    personalTransactions,
    attendances,
    users
  ] = await Promise.all([
    prisma.user.count(),
    prisma.match.count(),
    prisma.teamFundTransaction.findMany(),
    prisma.personalTransaction.findMany(),
    prisma.attendance.findMany(),
    prisma.user.findMany()
  ])

  // Process Finances
  const teamFundBalance = transactions.reduce((acc, t) =>
    t.transactionType === 'INCOME' ? acc + t.amount : acc - t.amount
    , 0)

  const personalFundLiability = users.reduce((acc, u) => acc + u.personalBalance, 0)

  // Process Expenses for Chart
  const expenseCategories = transactions
    .filter(t => t.transactionType === 'EXPENSE')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount
      return acc
    }, {} as Record<string, number>)

  const expenseData = Object.entries(expenseCategories).map(([name, value]) => ({ name, value }))

  // Process Attendance Chart (Top 5 attendees)
  const attendanceCounts = attendances.reduce((acc, a) => {
    acc[a.userId] = (acc[a.userId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">数据总览</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="在册球员"
          value={playerCount}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          subtitle="人"
        />
        <StatCard
          title="球队基金余额"
          value={`¥${teamFundBalance.toFixed(2)}`}
          icon={<Trophy className="h-6 w-6 text-emerald-500" />}
          subtitle="总计可用资金"
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
          value={matchCount}
          icon={<Activity className="h-6 w-6 text-orange-500" />}
          subtitle="场"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">基金支出分析</h2>
          {expenseData.length > 0 ? (
            <DashboardCharts type="pie" data={expenseData} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">暂无支出记录</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">出勤排行榜 (Top 5)</h2>
          {topAttendees.length > 0 ? (
            <DashboardCharts type="bar" data={topAttendees} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-400">暂无出勤记录</div>
          )}
        </div>
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
