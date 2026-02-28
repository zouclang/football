"use client"

import Link from 'next/link'
import { ArrowLeft, User, Shield, Activity, Wallet, Calendar as CalendarIcon, MapPin, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { Pagination } from './Pagination'

type Match = { id: string, date: Date, opponent: string, type: string, leagueName: string | null, ourScore: number | null, theirScore: number | null, result: string | null }
type Attendance = { id: string, goals: number, assists: number, match: Match }
type PersonalTransaction = { id: string, date: Date, amount: number, category: string, description: string | null }
type MemberFundTransaction = { id: string, date: Date, totalAmount: number, perPersonAmount: number | null, type: string, description: string | null }

type PlayerFull = {
    id: string
    name: string
    birthDate: string | null
    enrollmentYear: string | null
    major: string | null
    jerseyNumber: string | null
    jerseySize: string | null
    profilePhoto: string | null
    positions: string | null
    personalBalance: number
    isMember: boolean
    teamRole: string | null
    suzhouProofUrl: string | null
    educationProofUrl: string | null
    attendances: (Attendance & { match: Match })[]
    personalTransactions: PersonalTransaction[]
    memberTransactions: MemberFundTransaction[]
}

export function PlayerProfileClient({ player, totalMatches }: { player: PlayerFull, totalMatches: number }) {
    const currentYearFallback = new Date().getFullYear()
    const availableYears = Array.from(new Set(player.attendances.map(a => new Date(a.match.date).getFullYear()))).sort((a, b) => b - a)
    const [selectedYear, setSelectedYear] = useState<number | 'ALL'>(availableYears.length > 0 ? availableYears[0] : currentYearFallback)

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(5)

    // 生涯累计 (截止到选中年份，如果是 ALL 则为全部)
    const attendancesUpToSelectedYear = selectedYear === 'ALL'
        ? player.attendances
        : player.attendances.filter(a => new Date(a.match.date).getFullYear() <= selectedYear)
    const presentCount = attendancesUpToSelectedYear.length

    const totalGoals = attendancesUpToSelectedYear.reduce((sum, a) => sum + (a.goals || 0), 0)
    const totalAssists = attendancesUpToSelectedYear.reduce((sum, a) => sum + (a.assists || 0), 0)

    // 本阶段累计 (选中年份，如果是 ALL 则为全部)
    const attendancesInSelectedYear = selectedYear === 'ALL'
        ? player.attendances
        : player.attendances.filter(a => new Date(a.match.date).getFullYear() === selectedYear)

    // 按赛事类型 / 名称进行分组统计 (仅包含选中年份的数据)
    const groupedStats = attendancesInSelectedYear.reduce((acc, a) => {
        const m = a.match
        // 分组键：如果是高校联赛且有名字，则为联赛名，否则都归为“热身赛(及其他)”
        const groupKey = (m.type === 'LEAGUE' && m.leagueName) ? m.leagueName : '热身赛(及其他)'

        if (!acc[groupKey]) {
            acc[groupKey] = {
                leagueName: groupKey,
                allTime: { appearances: 0, goals: 0, assists: 0 }
            }
        }

        const dataNode = acc[groupKey]

        dataNode.allTime.appearances += 1
        dataNode.allTime.goals += (a.goals || 0)
        dataNode.allTime.assists += (a.assists || 0)

        return acc
    }, {} as Record<string, {
        leagueName: string,
        allTime: { appearances: number, goals: number, assists: number }
    }>)

    const statsList = Object.values(groupedStats)

    const totalCurrentYearApp = statsList.reduce((sum, stat) => sum + stat.allTime.appearances, 0)
    const totalCurrentYearGoals = statsList.reduce((sum, stat) => sum + stat.allTime.goals, 0)
    const totalCurrentYearAssists = statsList.reduce((sum, stat) => sum + stat.allTime.assists, 0)

    const positions = player.positions ? player.positions.split(',') : []

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Link href="/players" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">球员档案中心</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 第一列：巨幅肖像与主权宣告 */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-2xl p-6 shadow-xl text-white relative overflow-hidden">
                        {/* 装饰水印背景 */}
                        <div className="absolute -right-8 -bottom-8 opacity-10 blur-sm pointer-events-none">
                            <Shield className="w-48 h-48" />
                        </div>

                        <div className="flex flex-col items-center z-10 relative">
                            <div className="w-40 h-40 rounded-full border-4 border-white/20 overflow-hidden mb-6 bg-slate-800 flex justify-center items-center shadow-2xl">
                                {player.profilePhoto ? (
                                    <img src={player.profilePhoto} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-20 h-20 text-slate-500" />
                                )}
                            </div>

                            <h2 className="text-4xl font-black tracking-tight mb-2">{player.name}</h2>

                            {player.jerseyNumber && (
                                <div className="text-5xl font-black text-white/30 absolute top-4 left-6 pointer-events-none">
                                    #{player.jerseyNumber}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                {positions.length > 0 ? positions.map(p => (
                                    <span key={p} className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-sm font-bold tracking-wide">
                                        {p}
                                    </span>
                                )) : (
                                    <span className="px-3 py-1 bg-slate-800/50 text-slate-400 rounded-full text-sm">位置未定</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-indigo-500" /> 基础资料
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-slate-500 text-sm">尺码偏好</span>
                                <span className="font-medium">{player.jerseySize || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-slate-500 text-sm">出生年月</span>
                                <span className="font-medium">{player.birthDate || '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                <span className="text-slate-500 text-sm">入学界别</span>
                                <span className="font-medium">{player.enrollmentYear ? `${player.enrollmentYear}级` : '-'}</span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-slate-500 text-sm">学院与专业</span>
                                <span className="font-medium text-right max-w-[150px] truncate" title={player.major || ''}>{player.major || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
                {/* 第二列/第三列：战绩与资产 */}
                <div className="md:col-span-2 space-y-6">

                    {/* 资产卡片 */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 bg-gradient-to-r from-white to-slate-50">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                                    <Wallet className="w-5 h-5 text-emerald-600" />
                                    个人账户结余
                                </h3>
                            </div>
                            <div className={`text-4xl font-black tracking-tighter ${player.personalBalance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                ¥{player.personalBalance.toFixed(2)}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* 赛区出勤履历 */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:col-span-2">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-500" /> 分赛事阶段数据表现
                                </h3>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                    className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="ALL">全部</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year} 年</option>
                                    ))}
                                </select>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-600 bg-slate-50 uppercase font-semibold">
                                        <tr className="border-b border-slate-200 divide-x divide-slate-100 text-center">
                                            <th className="px-4 py-3 align-middle bg-slate-100/50 text-left">赛事名称</th>
                                            <th className="px-4 py-3 font-medium bg-emerald-50/30">出场</th>
                                            <th className="px-4 py-3 font-medium bg-emerald-50/30">进球</th>
                                            <th className="px-4 py-3 font-medium bg-emerald-50/30">助攻</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {statsList.length > 0 ? statsList.map((stat, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50 divide-x divide-slate-50 text-center">
                                                <td className="px-4 py-3 font-bold text-slate-800 text-left">{stat.leagueName}</td>
                                                <td className="px-4 py-3">{stat.allTime.appearances > 0 ? stat.allTime.appearances : '-'}</td>
                                                <td className="px-4 py-3 font-semibold text-emerald-600">{stat.allTime.goals > 0 ? stat.allTime.goals : '-'}</td>
                                                <td className="px-4 py-3 font-semibold text-emerald-600">{stat.allTime.assists > 0 ? stat.allTime.assists : '-'}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">没有任何比赛数据</td>
                                            </tr>
                                        )}
                                    </tbody>
                                    {statsList.length > 0 && (
                                        <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-800">
                                            <tr className="divide-x divide-slate-100 text-center">
                                                <td className="px-4 py-3 text-left">
                                                    {selectedYear === 'ALL' ? '全部年份累计' : `本年 (${selectedYear}) 累计`}
                                                </td>
                                                <td className="px-4 py-3 bg-emerald-50/50">{totalCurrentYearApp > 0 ? totalCurrentYearApp : '-'}</td>
                                                <td className="px-4 py-3 bg-emerald-50/50 text-emerald-600">{totalCurrentYearGoals > 0 ? totalCurrentYearGoals : '-'}</td>
                                                <td className="px-4 py-3 bg-emerald-50/50 text-emerald-600">{totalCurrentYearAssists > 0 ? totalCurrentYearAssists : '-'}</td>
                                            </tr>
                                            <tr className="divide-x divide-slate-100 text-center border-t border-slate-200">
                                                <td className="px-4 py-3 text-left w-full whitespace-nowrap">生涯累计 <span className="text-slate-400 font-normal ml-1">(截止到 {selectedYear === 'ALL' ? '目前' : selectedYear})</span></td>
                                                <td className="px-4 py-3 bg-indigo-50/50">{presentCount > 0 ? presentCount : '-'}</td>
                                                <td className="px-4 py-3 bg-indigo-50/50 text-indigo-600">{totalGoals > 0 ? totalGoals : '-'}</td>
                                                <td className="px-4 py-3 bg-indigo-50/50 text-indigo-600">{totalAssists > 0 ? totalAssists : '-'}</td>
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* 历史赛事履历（带展开明细） */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:col-span-2">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-indigo-500" /> 跟队比赛详情日志
                                </h3>
                            </div>

                            {player.attendances.length > 0 ? (
                                <>
                                    <div className="p-0 overflow-y-auto max-h-80 grow">
                                        <ul className="divide-y divide-slate-100">
                                            {player.attendances.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(a => (
                                                <li key={a.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <Link href={`/matches?editMatchId=${a.match.id}${a.match.type === 'LEAGUE' ? '&tournamentId=' + (a.match as any).tournamentId : ''}`} className="font-semibold text-slate-800 truncate hover:text-emerald-600 hover:underline transition-colors block" title={`${a.match.opponent} (${a.match.type === 'LEAGUE' && a.match.leagueName ? a.match.leagueName : '热身赛'})`}>
                                                            vs {a.match.opponent}
                                                            <span className="text-slate-400 font-normal text-xs ml-1.5 align-middle">
                                                                ({a.match.type === 'LEAGUE' && a.match.leagueName ? a.match.leagueName : '热身赛'})
                                                            </span>
                                                        </Link>
                                                        <div className="flex gap-1.5 ml-2 shrink-0">
                                                            {(a.goals > 0 || a.assists > 0) && (
                                                                <span className="text-xs font-bold px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700">
                                                                    {a.goals > 0 ? `${a.goals}球` : ''}{a.goals > 0 && a.assists > 0 ? '+' : ''}{a.assists > 0 ? `${a.assists}助` : ''}
                                                                </span>
                                                            )}
                                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 block">
                                                                出勤
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <CalendarIcon className="w-3 h-3" />
                                                        {format(new Date(a.match.date), 'yyyy-MM-dd')}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-2 border-t border-slate-100 bg-white shrink-0">
                                        <Pagination
                                            currentPage={currentPage}
                                            pageSize={pageSize}
                                            totalItems={player.attendances.length}
                                            onPageChange={setCurrentPage}
                                            onPageSizeChange={(size) => {
                                                setPageSize(size)
                                                setCurrentPage(1)
                                            }}
                                        />
                                    </div>
                                </>
                            ) : (
                                <div className="p-0 grow flex items-center justify-center min-h-[120px]">
                                    <div className="p-8 text-center text-slate-400 text-sm">
                                        暂无跟队比赛记录
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* 财务流水双栏布局 */}
                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 个人常规资金流水 */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <MapPin className="w-5 h-5 text-orange-500" /> 历史个人资金流转流水
                                    </h3>
                                </div>

                                <div className="p-0 overflow-y-auto max-h-80 grow">
                                    {player.personalTransactions.length > 0 ? (
                                        <ul className="divide-y divide-slate-100">
                                            {player.personalTransactions.map(t => (
                                                <li key={t.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <div className="font-medium text-slate-800">{t.category}</div>
                                                            {t.description && <div className="text-xs text-slate-500 line-clamp-1">{t.description}</div>}
                                                        </div>
                                                        <div className={`font-bold shrink-0 ${t.amount > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                            {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {format(new Date(t.date), 'yyyy-MM-dd HH:mm')}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-sm">
                                            暂无个人财务流水记录
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 会员费缴纳记录 */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-purple-500" /> 历史会员费缴纳记录
                                    </h3>
                                </div>

                                <div className="p-0 overflow-y-auto max-h-80 grow">
                                    {player.memberTransactions && player.memberTransactions.length > 0 ? (
                                        <ul className="divide-y divide-slate-100">
                                            {player.memberTransactions.map(t => (
                                                <li key={t.id} className="p-4 hover:bg-slate-50 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <div className="font-medium text-slate-800">
                                                                {t.type === 'INCOME' ? '会员费缴纳' : '基金调拨/兜底'}
                                                            </div>
                                                            {t.description && <div className="text-xs text-slate-500 line-clamp-1">{t.description}</div>}
                                                        </div>
                                                        <div className={`font-bold shrink-0 ${t.type === 'INCOME' ? 'text-purple-600' : 'text-rose-600'}`}>
                                                            {t.type === 'INCOME' ? '+' : '-'}¥{(t.perPersonAmount || t.totalAmount).toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <div className="text-[10px] text-slate-400">
                                                        {format(new Date(t.date), 'yyyy-MM-dd HH:mm')}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="p-8 text-center text-slate-400 text-sm">
                                            暂无会员费缴纳记录
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div >
            </div >
        </div >
    )
}
