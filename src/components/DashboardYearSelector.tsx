"use client"

import { useRouter, usePathname } from 'next/navigation'

export function DashboardYearSelector({ currentYear }: { currentYear: string }) {
    const router = useRouter()
    const pathname = usePathname()
    // Compute year list using a stable server-safe approach
    // 2026 is the first tracked year; upper bound is the year this code last deployed.
    // suppressHydrationWarning prevents mismatch if client year differs from server.
    const currentYearNum = new Date().getFullYear()
    const yearList = Array.from({ length: Math.max(0, currentYearNum - 2026 + 1) }, (_, i) => 2026 + i).reverse()

    return (
        <select
            value={currentYear}
            onChange={(e) => {
                const year = e.target.value
                router.push(year === 'ALL' ? pathname : `${pathname}?year=${year}`)
            }}
            className="text-sm bg-white border border-slate-200 text-slate-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            suppressHydrationWarning
        >
            <option value="ALL">全部</option>
            {yearList.map(y => (
                <option key={y} value={y.toString()}>{y}年</option>
            ))}
        </select>
    )
}
