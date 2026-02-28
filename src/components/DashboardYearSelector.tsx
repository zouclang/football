"use client"

import { useRouter, useSearchParams } from 'next/navigation'

export function DashboardYearSelector({ currentYear }: { currentYear: string }) {
    const router = useRouter()
    const currentYearNum = new Date().getFullYear()

    return (
        <select
            value={currentYear}
            onChange={(e) => {
                const year = e.target.value
                router.push(year === 'ALL' ? '/' : `/?year=${year}`)
            }}
            className="text-sm bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
        >
            <option value="ALL">全部</option>
            {Array.from({ length: 5 }, (_, i) => currentYearNum - i).map(y => (
                <option key={y} value={y.toString()}>{y}年</option>
            ))}
        </select>
    )
}
