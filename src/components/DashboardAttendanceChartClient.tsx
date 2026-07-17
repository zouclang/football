"use client"

import { useState } from 'react'
import { DashboardCharts } from './DashboardCharts'

export function DashboardAttendanceChartClient({ timelineData }: { timelineData: { date: Date, opponent: string, count: number }[] }) {
    const currentYearStr = new Date().getFullYear().toString()
    const [selectedYear, setSelectedYear] = useState<string>(currentYearStr)

    // Filter by year
    const filteredData = timelineData.filter(d => new Date(d.date).getUTCFullYear().toString() === selectedYear)

    // Format for charts
    const chartData = filteredData.map(d => ({
        name: new Date(d.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ` vs ${d.opponent}`,
        count: d.count
    }))

    // Generate years from 2026 to current year
    const startYear = 2026;
    const currentYearNum = new Date().getFullYear();
    const years = Array.from({ length: Math.max(1, currentYearNum - startYear + 1) }, (_, i) => (startYear + i).toString()).reverse();

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full col-span-1 lg:col-span-2 mt-6">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                    出勤走势
                </h2>
                <select
                    className="text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm cursor-pointer"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                >
                    {years.map(y => (
                        <option key={y} value={y}>{y}年</option>
                    ))}
                </select>
            </div>
            {chartData.length > 0 ? (
                <div className="flex-1 min-h-[300px]">
                    <DashboardCharts type="line" data={chartData} barName="出勤人数" barColor="#ec4899" />
                </div>
            ) : (
                <div className="flex-1 min-h-[300px] flex items-center justify-center text-slate-400">
                    暂无活动记录
                </div>
            )}
        </div>
    )
}
