"use client"

import Link from 'next/link'
import { ArrowLeft, User, Shield, Activity, Wallet, Calendar as CalendarIcon, MapPin, GraduationCap, Trophy, Zap, Star } from 'lucide-react'
import { format } from 'date-fns'
import { useState } from 'react'
import { Pagination } from './Pagination'

type Match = { id: string, date: Date, opponent: string, type: string, leagueName: string | null, tournament?: { name: string } | null, ourScore: number | null, theirScore: number | null, result: string | null }
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
    isActive: boolean
    isRetired: boolean
    teamRole: string | null
    historicalMatches: number
    historicalGoals: number
    historicalAssists: number
    suzhouProofUrl: string | null
    educationProofUrl: string | null
    attendances: (Attendance & { match: Match })[]
    personalTransactions: PersonalTransaction[]
    memberTransactions: MemberFundTransaction[]
}

export function PlayerProfileClient({ player, matchCountsByYear, role = 'player', currentPlayerId }: { player: PlayerFull, matchCountsByYear: Record<string, number>, role?: 'admin' | 'player', currentPlayerId?: string }) {
    const currentYear = new Date().getFullYear()
    const yearsFrom2026 = Array.from({ length: Math.max(0, currentYear - 2026 + 1) }, (_, i) => 2026 + i)
    const attendanceYears = player.attendances.map(a => new Date(a.match.date).getFullYear())
    const availableYears = Array.from(new Set([...yearsFrom2026, ...attendanceYears])).sort((a, b) => b - a)

    // 年份选项逻辑：始终包含 "全部", "2026之前" (如果有历史数据), 以及各个自然年
    const [selectedYear, setSelectedYear] = useState<number | 'ALL' | 'BEFORE_2026'>('ALL')

    // 出勤率计算逻辑：固定显示本年度（如 2026）
    const actualCurrentYear = new Date().getFullYear().toString()
    const totalTeamMatchesThisYear = matchCountsByYear[actualCurrentYear] || 0
    const playerAttendancesThisYear = player.attendances.filter(a => new Date(a.match.date).getFullYear().toString() === actualCurrentYear).length

    const currentYearAttendanceRate = totalTeamMatchesThisYear > 0
        ? Math.round((playerAttendancesThisYear / totalTeamMatchesThisYear) * 100)
        : 0

    // 分页状态
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(5)

    // 生涯累计 (截止到目前，始终包含历史数据)
    const totalGoals = player.attendances.reduce((sum, a) => sum + (a.goals || 0), 0) + player.historicalGoals
    const totalAssists = player.attendances.reduce((sum, a) => sum + (a.assists || 0), 0) + player.historicalAssists
    const presentCount = player.attendances.length + player.historicalMatches

    // --- 统计数据列表生成逻辑 ---
    let statsList: { leagueName: string, allTime: { appearances: number, goals: number, assists: number } }[] = []

    if (selectedYear === 'ALL' || selectedYear === 'BEFORE_2026') {
        // 汇总视图 (全部 或 2026之前)
        const pre2026App = player.historicalMatches + player.attendances.filter(a => new Date(a.match.date).getFullYear() < 2026).length
        const pre2026Goals = player.historicalGoals + player.attendances.filter(a => new Date(a.match.date).getFullYear() < 2026).reduce((sum, a) => sum + (a.goals || 0), 0)
        const pre2026Assists = player.historicalAssists + player.attendances.filter(a => new Date(a.match.date).getFullYear() < 2026).reduce((sum, a) => sum + (a.assists || 0), 0)

        const post2026App = player.attendances.filter(a => new Date(a.match.date).getFullYear() >= 2026).length
        const post2026Goals = player.attendances.filter(a => new Date(a.match.date).getFullYear() >= 2026).reduce((sum, a) => sum + (a.goals || 0), 0)
        const post2026Assists = player.attendances.filter(a => new Date(a.match.date).getFullYear() >= 2026).reduce((sum, a) => sum + (a.assists || 0), 0)

        if (selectedYear === 'ALL') {
            if (pre2026App > 0) statsList.push({ leagueName: '2026年之前数据汇总', allTime: { appearances: pre2026App, goals: pre2026Goals, assists: pre2026Assists } })

            // 2026年及以后：按年份单独汇总
            const post2026Years = Array.from(new Set(player.attendances.filter(a => new Date(a.match.date).getFullYear() >= 2026).map(a => new Date(a.match.date).getFullYear()))).sort((a, b) => a - b)

            post2026Years.forEach(year => {
                const yearAttendances = player.attendances.filter(a => new Date(a.match.date).getFullYear() === year)
                const yApp = yearAttendances.length
                const yGoals = yearAttendances.reduce((sum, a) => sum + (a.goals || 0), 0)
                const yAssists = yearAttendances.reduce((sum, a) => sum + (a.assists || 0), 0)

                if (yApp > 0) {
                    statsList.push({ leagueName: `${year}年数据汇总`, allTime: { appearances: yApp, goals: yGoals, assists: yAssists } })
                }
            })
        } else {
            // 2026年之前专区：直接展示单行汇总
            if (pre2026App > 0) statsList.push({ leagueName: '2026年之前数据汇总', allTime: { appearances: pre2026App, goals: pre2026Goals, assists: pre2026Assists } })
        }
    } else {
        // 年度/特定视图：展示具体赛事明细
        const filteredAttendances = player.attendances.filter(a => new Date(a.match.date).getFullYear() === selectedYear)

        const grouped = filteredAttendances.reduce((acc, a) => {
            const m = a.match
            const groupKey = m.type === 'LEAGUE' ? (m.leagueName || m.tournament?.name || '高校联赛') : '热身赛'
            if (!acc[groupKey]) acc[groupKey] = { leagueName: groupKey, allTime: { appearances: 0, goals: 0, assists: 0 } }
            acc[groupKey].allTime.appearances += 1
            acc[groupKey].allTime.goals += (a.goals || 0)
            acc[groupKey].allTime.assists += (a.assists || 0)
            return acc
        }, {} as Record<string, { leagueName: string, allTime: { appearances: number, goals: number, assists: number } }>)

        statsList = Object.values(grouped)
    }

    const totalCurrentYearApp = statsList.reduce((sum, stat) => sum + stat.allTime.appearances, 0)
    const totalCurrentYearGoals = statsList.reduce((sum, stat) => sum + stat.allTime.goals, 0)
    const totalCurrentYearAssists = statsList.reduce((sum, stat) => sum + stat.allTime.assists, 0)

    const positions = player.positions ? player.positions.split(',') : []

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-12">
            <div className="flex items-center gap-4">
                <Link href="/players" className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold text-slate-800">球员档案中心</h1>
            </div>

            {/* 炫酷单体 Hero Section */}
            <div className="relative mb-10 group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-900 rounded-3xl overflow-hidden shadow-2xl transition-all duration-500">
                    <div className="absolute top-0 -left-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-0 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] animate-pulse delay-700"></div>
                </div>

                <div className="relative z-10 p-8 md:p-12 flex flex-col xl:flex-row items-center xl:justify-between gap-10">
                    {/* 左侧：肖像与基本信息 */}
                    <div className="flex flex-col md:flex-row items-center gap-8 flex-1">
                        <div className="relative shrink-0">
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-2xl group-hover:bg-emerald-400/30 transition-all duration-700"></div>
                            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-white/20 p-2 relative z-10 bg-slate-800/50 backdrop-blur-sm shadow-2xl flex justify-center items-center overflow-hidden">
                                <div className="w-full h-full rounded-full border-4 border-emerald-400/30 overflow-hidden bg-slate-700">
                                    {player.profilePhoto ? (
                                        <img src={player.profilePhoto} alt={player.name} className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <User className="w-24 h-24 text-slate-500" />
                                    )}
                                </div>
                            </div>
                            {player.jerseyNumber && (
                                <div className="absolute -bottom-2 -left-2 bg-emerald-500 text-white w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg border-4 border-slate-900 z-20 transform -rotate-12">
                                    #{player.jerseyNumber}
                                </div>
                            )}
                        </div>

                        <div className="text-center md:text-left space-y-4">
                            <div className="space-y-1">
                                <div className="flex flex-wrap gap-2">
                                    {player.isRetired ? (
                                        <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold tracking-widest uppercase">
                                            已挂靴
                                        </span>
                                    ) : !player.isActive ? (
                                        <span className="inline-block px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold tracking-widest uppercase">
                                            暂时隐退
                                        </span>
                                    ) : null}
                                    {player.teamRole && (
                                        <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold tracking-widest uppercase">
                                            {player.teamRole}
                                        </span>
                                    )}
                                    {player.isMember && (
                                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold tracking-widest uppercase">
                                            <Star className="w-3 h-3 fill-current" />
                                            会员
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                    <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white drop-shadow-md whitespace-nowrap">
                                        {player.name}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        {player.birthDate && (
                                            <span className="px-3 py-1 bg-slate-900/40 backdrop-blur-md rounded-lg text-rose-400 text-sm font-bold border border-rose-500/10">
                                                {new Date().getFullYear() - parseInt(player.birthDate)}岁
                                            </span>
                                        )}
                                        {(player.enrollmentYear || player.major) && (
                                            <span className="px-3 py-1 bg-slate-900/40 backdrop-blur-md rounded-lg text-blue-300 text-sm font-bold border border-blue-500/10 whitespace-nowrap">
                                                {player.enrollmentYear ? `${player.enrollmentYear}级 ` : ''}
                                                {player.major || ''}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                                {positions.length > 0 ? positions.map(p => (
                                    <span key={p} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold tracking-widest uppercase">
                                        {p}
                                    </span>
                                )) : (
                                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold tracking-widest uppercase opacity-50">位置未定</span>
                                )}
                                <div className="px-4 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-xl text-sm font-bold tracking-wide flex items-center gap-2">
                                    <Activity className="w-4 h-4" />
                                    {actualCurrentYear}年出勤率: {currentYearAttendanceRate}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 右侧：生涯核心战绩指标 */}
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        {[
                            {
                                label: '累计出场',
                                value: presentCount,
                                icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M12 4v16" /><circle cx="12" cy="12" r="3" /><path d="M2 12h3" /><path d="M19 12h3" />
                                    </svg>
                                )
                            },
                            {
                                label: '累计进球',
                                value: totalGoals,
                                icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <circle cx="12" cy="12" r="10" /><path d="m11 7 4 3-1 5h-4l-1-5 4-3Z" /><path d="M11 7V2" /><path d="M15 10l5-1" /><path d="M14 15l3 4" /><path d="M10 15l-3 4" /><path d="M9 10l-5-1" />
                                    </svg>
                                )
                            },
                            {
                                label: '累计助攻',
                                value: totalAssists,
                                icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <path d="M3 17h1l3 3h3l2-3h5v3l3 2v2H3v-7Z" /><path d="M12 13V8l6 3" /><path d="M15 11l3-1" />
                                    </svg>
                                )
                            },
                            {
                                label: '账户结余',
                                value: `¥${player.personalBalance.toFixed(0)}`,
                                icon: (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                        <path d="M12 12V7l4-5M8 2l4 5M8 12h8M8 16h8M12 16v6" />
                                    </svg>
                                )
                            },
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-950/60 backdrop-blur-md rounded-2xl p-4 border border-white/10 w-32 h-24 flex flex-col justify-center items-center group hover:bg-slate-900/80 transition-all shadow-xl">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2 border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-black text-white leading-none mb-1 tabular-nums drop-shadow-sm">{stat.value}</div>
                                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest leading-none text-center">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* 赛区出勤履历 */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-sm border border-white overflow-hidden flex flex-col md:col-span-2">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg">
                            <Activity className="w-5 h-5 text-blue-500" /> 数据统计摘要
                        </h3>
                        <select
                            value={selectedYear}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSelectedYear(val === 'ALL' || val === 'BEFORE_2026' ? val : Number(val));
                            }}
                            className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer hover:bg-white"
                        >
                            <option value="ALL">全部赛季统计</option>
                            {(player.historicalMatches > 0) && <option value="BEFORE_2026">2026年之前历史数据</option>}
                            {availableYears.filter(y => y >= 2026).map(year => (
                                <option key={year} value={year}>{year} 年度数据</option>
                            ))}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 bg-slate-100/30 uppercase font-black tracking-wider">
                                <tr className="border-b border-slate-200 divide-x divide-slate-100/50 text-center">
                                    <th className="px-6 py-4 align-middle text-left text-slate-900">分组 / 赛事名称</th>
                                    <th className="px-6 py-4">出场</th>
                                    <th className="px-6 py-4">进球</th>
                                    <th className="px-6 py-4">助攻</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80 text-slate-700">
                                {statsList.length > 0 ? statsList.map((stat, idx) => (
                                    <tr key={idx} className={`hover:bg-white/50 transition-colors divide-x divide-slate-50 text-center group ${selectedYear === 'ALL' ? 'bg-blue-50/40' : ''}`}>
                                        <td className="px-6 py-4 font-bold text-slate-900 text-left group-hover:text-blue-600 transition-colors uppercase tracking-tight">{stat.leagueName}</td>
                                        <td className="px-6 py-4 text-base font-medium">{stat.allTime.appearances > 0 ? stat.allTime.appearances : '-'}</td>
                                        <td className="px-6 py-4 text-base font-black text-emerald-600 font-mono">{stat.allTime.goals > 0 ? stat.allTime.goals : '-'}</td>
                                        <td className="px-6 py-4 text-base font-black text-emerald-600 font-mono">{stat.allTime.assists > 0 ? stat.allTime.assists : '-'}</td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic font-medium">没有任何比赛数据记录</td>
                                    </tr>
                                )}
                            </tbody>
                            {statsList.length > 0 && (
                                <tfoot className="bg-slate-50/80 backdrop-blur-md font-bold border-t-2 border-slate-200 text-slate-900">
                                    {typeof selectedYear === 'number' && (
                                        <tr className="divide-x divide-slate-100/50 text-center font-black bg-white/40">
                                            <td className="px-6 py-4 text-left w-full whitespace-nowrap text-blue-600">
                                                {selectedYear}年年度累计汇总
                                            </td>
                                            <td className="px-6 py-4 text-base">{totalCurrentYearApp > 0 ? totalCurrentYearApp : '-'}</td>
                                            <td className="px-6 py-4 text-base text-emerald-600">{totalCurrentYearGoals > 0 ? totalCurrentYearGoals : '-'}</td>
                                            <td className="px-6 py-4 text-base text-emerald-600">{totalCurrentYearAssists > 0 ? totalCurrentYearAssists : '-'}</td>
                                        </tr>
                                    )}
                                    {selectedYear === 'ALL' && (
                                        <tr className="divide-x divide-slate-100/50 text-center border-t border-slate-200 bg-slate-900 text-white shadow-2xl">
                                            <td className="px-6 py-4 text-left w-full whitespace-nowrap font-black uppercase tracking-widest text-white/90">生涯统计总览 <span className="text-white/40 font-normal ml-2 text-[10px]">(含系统上线前历史存量)</span></td>
                                            <td className="px-6 py-4 text-xl font-black">{presentCount > 0 ? presentCount : '-'}</td>
                                            <td className="px-6 py-4 text-xl font-black text-emerald-400">{totalGoals > 0 ? totalGoals : '-'}</td>
                                            <td className="px-6 py-4 text-xl font-black text-emerald-400">{totalAssists > 0 ? totalAssists : '-'}</td>
                                        </tr>
                                    )}
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* 历史赛事履历（带展开明细） */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-sm border border-white overflow-hidden flex flex-col md:col-span-2">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                            <Activity className="w-5 h-5 text-indigo-500" /> 战绩足迹 · 比赛详情日志
                        </h3>
                    </div>

                    {player.attendances.length > 0 ? (
                        <>
                            <div className="p-0 overflow-y-auto max-h-80 grow">
                                <ul className="divide-y divide-slate-100">
                                    {player.attendances.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(a => (
                                        <li key={a.id} className="p-4 hover:bg-slate-50 transition-colors">
                                            <div className="flex justify-between items-center mb-1">
                                                <Link href={`/matches?editMatchId=${a.match.id}${a.match.type === 'LEAGUE' ? '&tournamentId=' + (a.match as any).tournamentId : ''}`} className="font-semibold text-slate-800 truncate hover:text-emerald-600 hover:underline transition-colors block" title={`${a.match.opponent} (${a.match.type === 'LEAGUE' ? (a.match.leagueName || a.match.tournament?.name || '高校联赛') : '热身赛'})`}>
                                                    vs {a.match.opponent}
                                                    <span className="text-slate-400 font-normal text-xs ml-1.5 align-middle">
                                                        ({a.match.type === 'LEAGUE' ? (a.match.leagueName || a.match.tournament?.name || '高校联赛') : '热身赛'})
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
                                                        {t.type === 'INCOME' ? '会员费缴纳' : '赞助费调拨/兜底'}
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
    )
}
