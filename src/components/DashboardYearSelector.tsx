"use client"

import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

export function DashboardYearSelector({ currentYear }: { currentYear: string }) {
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)
    const currentYearNum = new Date().getFullYear()

    useEffect(() => {
        setIsMounted(true)
    }, [])

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
            <option value="BEFORE_2026">2026年之前</option>
            {isMounted && Array.from({ length: Math.max(0, currentYearNum - 2026 + 1) }, (_, i) => 2026 + i).reverse().map(y => (
                <option key={y} value={y.toString()}>{y}年</option>
            ))}
        </select>
    )
}
