"use client"

import { DashboardYearSelector } from './DashboardYearSelector'
import { Shield } from 'lucide-react'

type LeaderboardPlayer = {
    id: string
    name: string
    profilePhoto: string | null
    total: number
    breakdown: {
        LEAGUE_ATTENDANCE: number
        LEAGUE_GOAL: number
        LEAGUE_ASSIST: number
        WINNING_GK: number
        FRIENDLY_ATTENDANCE: number
        LATE: number
        DROP_IN: number
        NO_SHOW: number
    }
}

export function LeaderboardClient({ data, currentYear }: { data: LeaderboardPlayer[], currentYear: string }) {
    // Determine rank accounting for ties
    let currentRank = 1;
    let prevScore = data.length > 0 ? data[0].total : 0;
    
    const rankedData = data.map((player, index) => {
        if (player.total < prevScore) {
            currentRank = index + 1;
            prevScore = player.total;
        }
        return { ...player, rank: currentRank };
    });

    const getMedal = (rank: number) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return <span className="px-2 text-slate-400">{rank}</span>;
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-[#3a0d0d] via-[#1a0505] to-[#0a0202] text-amber-50/90 pb-20 font-sans">
            <div className="max-w-6xl mx-auto px-4 pt-12">
                {/* Header Section */}
                <div className="flex flex-col items-center justify-center mb-10">
                    <div className="w-16 h-20 bg-[#c81e1e] rounded-b-full flex items-center justify-center mb-4 shadow-lg shadow-red-900/50 border-t-2 border-amber-500/50">
                        <Shield className="w-8 h-8 text-amber-100" />
                    </div>
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 tracking-wider mb-2">
                        积分榜
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-red-200/60 mb-6">
                        <span>{data.length} 名球员</span>
                        <span>•</span>
                        <div className="inline-block relative">
                           <DashboardYearSelector currentYear={currentYear} />
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="overflow-x-auto bg-[#250808]/80 backdrop-blur-md rounded-xl border border-red-900/30 shadow-2xl">
                    <table className="w-full text-sm text-center whitespace-nowrap">
                        <thead>
                            <tr className="border-b border-red-900/50 bg-[#1a0505]/80 text-amber-200/70 text-xs tracking-wider">
                                <th className="px-4 py-4 font-medium text-left">姓名</th>
                                <th className="px-2 py-4 font-medium">名次</th>
                                <th className="px-2 py-4 font-medium">联赛<br/>出勤</th>
                                <th className="px-2 py-4 font-medium">联赛<br/>进球</th>
                                <th className="px-2 py-4 font-medium">联赛<br/>助攻</th>
                                <th className="px-2 py-4 font-medium">取胜<br/>门将</th>
                                <th className="px-2 py-4 font-medium">热身赛<br/>出勤</th>
                                <th className="px-2 py-4 font-medium">迟到</th>
                                <th className="px-2 py-4 font-medium">空降</th>
                                <th className="px-2 py-4 font-medium">鸽子</th>
                                <th className="px-4 py-4 font-bold text-amber-400 text-base">总分</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-red-900/30">
                            {rankedData.map((player) => (
                                <tr key={player.id} className="hover:bg-red-900/20 transition-colors group">
                                    <td className="px-4 py-3 text-left font-medium text-amber-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {player.name}
                                    </div>
                                </td>
                                    <td className="px-2 py-3 font-semibold text-lg">{getMedal(player.rank)}</td>
                                    <td className="px-2 py-3 text-red-100/50">{player.breakdown.LEAGUE_ATTENDANCE || <span className="text-red-900/30">0</span>}</td>
                                    <td className="px-2 py-3 text-red-100/50">{player.breakdown.LEAGUE_GOAL || <span className="text-red-900/30">0</span>}</td>
                                    <td className="px-2 py-3 text-red-100/50">{player.breakdown.LEAGUE_ASSIST || <span className="text-red-900/30">0</span>}</td>
                                    <td className="px-2 py-3 text-red-100/50">{player.breakdown.WINNING_GK || <span className="text-red-900/30">0</span>}</td>
                                    <td className="px-2 py-3 text-red-100/50">{player.breakdown.FRIENDLY_ATTENDANCE || <span className="text-red-900/30">0</span>}</td>
                                    <td className="px-2 py-3 text-red-100/50">{player.breakdown.LATE || <span className="text-red-900/30">0</span>}</td>
                                    <td className="px-2 py-3 text-red-100/50">{player.breakdown.DROP_IN || <span className="text-red-900/30">0</span>}</td>
                                    <td className="px-2 py-3 text-red-100/50">{player.breakdown.NO_SHOW || <span className="text-red-900/30">0</span>}</td>
                                    <td className="px-4 py-3 font-bold text-amber-400 text-base bg-red-950/20">{player.total}</td>
                                </tr>
                            ))}
                            {rankedData.length === 0 && (
                                <tr>
                                    <td colSpan={11} className="px-4 py-12 text-center text-red-200/40">
                                        暂无积分数据
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
