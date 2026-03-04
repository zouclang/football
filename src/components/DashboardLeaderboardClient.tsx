"use client"

import { useState } from 'react'
import { DashboardCharts } from './DashboardCharts'

type LeaderboardData = { name: string, count: number }

export function DashboardLeaderboardClient({
    attendanceData,
    goalsData,
    assistsData
}: {
    attendanceData: LeaderboardData[],
    goalsData: LeaderboardData[],
    assistsData: LeaderboardData[]
}) {
    const [viewType, setViewType] = useState<'attendance' | 'goals' | 'assists'>('attendance')

    let currentData = attendanceData
    let title = "出勤排行榜"
    let barName = "出勤次数"
    let barColor = "#3b82f6"

    if (viewType === 'goals') {
        currentData = goalsData
        title = "进球排行榜"
        barName = "进球数"
        barColor = "#10b981"
    } else if (viewType === 'assists') {
        currentData = assistsData
        title = "助攻排行榜"
        barName = "助攻数"
        barColor = "#f59e0b"
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                    {title} (Top 5)
                </h2>
                <select
                    className="text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm cursor-pointer"
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value as 'attendance' | 'goals' | 'assists')}
                >
                    <option value="attendance">出勤榜</option>
                    <option value="goals">射手榜</option>
                    <option value="assists">助攻榜</option>
                </select>
            </div>
            {currentData.length > 0 ? (
                <div className="flex-1 min-h-[300px]">
                    <DashboardCharts type="bar" data={currentData} barName={barName} barColor={barColor} />
                </div>
            ) : (
                <div className="flex-1 min-h-[300px] flex items-center justify-center text-slate-400">
                    暂无相关记录
                </div>
            )}
        </div>
    )
}
