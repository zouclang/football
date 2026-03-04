"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Trophy, Users, LayoutDashboard, Calendar, DollarSign, Menu, X, LogOut, Shield } from 'lucide-react'
import { useState, useEffect } from 'react'
import { logoutAction } from '@/lib/actions/auth'

const navItems = [
    { href: '/', label: '总览', icon: LayoutDashboard },
    { href: '/players', label: '球员管理', icon: Users },
    { href: '/tournaments', label: '赛事管理', icon: Trophy },
    { href: '/matches', label: '考勤管理', icon: Calendar },
    { href: '/finance', label: '财务管理', icon: DollarSign },
]

function getSessionFromCookie(): { role: string, playerName?: string } | null {
    if (typeof document === 'undefined') return null
    const match = document.cookie.match(/auth_session=([^;]+)/)
    if (!match) return null
    try {
        return JSON.parse(decodeURIComponent(match[1]))
    } catch {
        return null
    }
}

export function Navbar() {
    const pathname = usePathname()
    const [isOpen, setIsOpen] = useState(false)
    const [session, setSession] = useState<{ role: string, playerName?: string } | null>(null)

    useEffect(() => {
        setSession(getSessionFromCookie())
    }, [])

    // 登录页不显示导航栏
    if (pathname === '/login') return null

    const handleLogout = async () => {
        await logoutAction()
    }

    return (
        <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-8 w-8 text-emerald-500" />
                        <span className="font-bold text-xl tracking-tight hidden sm:inline">大连理工大学苏州校友会足球队</span>
                        <span className="font-bold text-lg tracking-tight sm:hidden">DUT苏州⚽</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-2">
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

                        {/* 身份标识 & 退出 */}
                        <div className="flex items-center gap-2 ml-4 pl-4 border-l border-slate-700">
                            {session && (
                                <span className={cn(
                                    "text-xs px-2 py-1 rounded-full font-medium",
                                    session.role === 'admin'
                                        ? "bg-amber-500/20 text-amber-300"
                                        : "bg-blue-500/20 text-blue-300"
                                )}>
                                    {session.role === 'admin' ? (
                                        <><Shield className="w-3 h-3 inline mr-1" />管理员</>
                                    ) : (
                                        session.playerName || '队员'
                                    )}
                                </span>
                            )}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                                title="退出登录"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden flex items-center gap-2">
                        {session && (
                            <span className={cn(
                                "text-xs px-2 py-1 rounded-full font-medium",
                                session.role === 'admin'
                                    ? "bg-amber-500/20 text-amber-300"
                                    : "bg-blue-500/20 text-blue-300"
                            )}>
                                {session.role === 'admin' ? '管理员' : (session.playerName || '队员')}
                            </span>
                        )}
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
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-red-400 hover:bg-slate-800 hover:text-red-300 w-full"
                        >
                            <LogOut className="h-5 w-5" />
                            退出登录
                        </button>
                    </div>
                </div>
            )}
        </nav>
    )
}
