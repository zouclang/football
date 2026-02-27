"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// #8: 改用统一的 cn() 工具函数，删除本文件内的重复定义
import { cn } from '@/lib/utils'
import { Trophy, Users, LayoutDashboard, Calendar, DollarSign, Menu, X } from 'lucide-react'
import { useState } from 'react'

const navItems = [
    { href: '/', label: '总览', icon: LayoutDashboard },
    { href: '/players', label: '球员管理', icon: Users },
    { href: '/team', label: '球队概况', icon: Trophy },
    { href: '/matches', label: '比赛考勤', icon: Calendar },
    { href: '/finance', label: '财务管理', icon: DollarSign },
]

export function Navbar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)

    return (
        <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-emerald-500" />
                        <span className="font-bold text-xl tracking-tight">校友会足球队</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:block">
                        <div className="flex items-baseline space-x-4">
                            {navItems.map((item) => {
                                const Icon = item.icon
                                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                            isActive
                                                ? "bg-emerald-600 text-white"
                                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {item.label}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
                        >
                            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden bg-slate-900 border-t border-slate-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={() => setIsOpen(false)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium",
                                        isActive
                                            ? "bg-emerald-600 text-white"
                                            : "text-slate-300 hover:bg-slate-800 hover:text-white"
                                    )}
                                >
                                    <Icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            )
                        })}
                    </div>
                </div>
            )}
        </nav>
    )
}
