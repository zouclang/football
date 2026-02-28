"use client"

import { useState } from 'react'
import { DashboardCharts } from './DashboardCharts'

type ChartData = { name: string, value: number }

export function DashboardFinanceChartClient({
    expenseData,
    incomeData
}: {
    expenseData: ChartData[],
    incomeData: ChartData[]
}) {
    const [viewType, setViewType] = useState<'expense' | 'income'>('expense')

    const currentData = viewType === 'expense' ? expenseData : incomeData

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-800">
                    基金{viewType === 'expense' ? '支出' : '收入'}分析
                </h2>
                <select
                    className="text-sm bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow shadow-sm cursor-pointer"
                    value={viewType}
                    onChange={(e) => setViewType(e.target.value as 'expense' | 'income')}
                >
                    <option value="expense">支出分析</option>
                    <option value="income">收入分析</option>
                </select>
            </div>
            {currentData.length > 0 ? (
                <div className="flex-1 min-h-[300px]">
                    <DashboardCharts type="pie" data={currentData} />
                </div>
            ) : (
                <div className="flex-1 min-h-[300px] flex items-center justify-center text-slate-400">
                    暂无相关记录
                </div>
            )}
        </div>
    )
}
