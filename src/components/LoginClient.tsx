"use client"

import { useState } from 'react'
import { Trophy, Shield, Users, Eye, EyeOff } from 'lucide-react'
import { loginAsAdmin, loginAsPlayer } from '@/lib/actions/auth'

export function LoginClient() {
    const [tab, setTab] = useState<'admin' | 'player'>('admin')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showPwd, setShowPwd] = useState(false)

    // 管理员表单
    const [adminPwd, setAdminPwd] = useState('')

    // 队员表单
    const [playerName, setPlayerName] = useState('')
    const [playerPwd, setPlayerPwd] = useState('')

    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!adminPwd.trim()) { setError('请输入密码'); return }
        setLoading(true)
        setError('')
        try {
            const result = await loginAsAdmin(adminPwd.trim())
            if (result?.error) setError(result.error)
        } catch (err: any) {
            // redirect 会抛出 NEXT_REDIRECT，这是正常的
            if (err?.digest?.startsWith('NEXT_REDIRECT')) return
            setError('登录失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    const handlePlayerLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!playerName.trim()) { setError('请输入您的姓名'); return }
        if (!playerPwd.trim()) { setError('请输入密码'); return }
        setLoading(true)
        setError('')
        try {
            const result = await loginAsPlayer(playerName.trim(), playerPwd.trim())
            if (result?.error) setError(result.error)
        } catch (err: any) {
            if (err?.digest?.startsWith('NEXT_REDIRECT')) return
            setError('登录失败，请重试')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/20 rounded-2xl mb-4">
                        <Trophy className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white">大连理工大学苏州校友会</h1>
                    <p className="text-slate-400 mt-1">足球队管理系统</p>
                </div>

                {/* Login Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                    {/* Tab Switcher */}
                    <div className="flex border-b border-white/10">
                        <button
                            onClick={() => { setTab('admin'); setError('') }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${tab === 'admin'
                                ? 'bg-emerald-500/20 text-emerald-300 border-b-2 border-emerald-400'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Shield className="w-4 h-4" /> 管理员登录
                        </button>
                        <button
                            onClick={() => { setTab('player'); setError('') }}
                            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors ${tab === 'player'
                                ? 'bg-blue-500/20 text-blue-300 border-b-2 border-blue-400'
                                : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Users className="w-4 h-4" /> 队员登录
                        </button>
                    </div>

                    {/* Form Area */}
                    <div className="p-6">
                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm text-center">
                                {error}
                            </div>
                        )}

                        {tab === 'admin' ? (
                            <form onSubmit={handleAdminLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">管理员密码</label>
                                    <div className="relative">
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={adminPwd}
                                            onChange={e => setAdminPwd(e.target.value)}
                                            placeholder="请输入管理员密码"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd(!showPwd)}
                                            className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                                        >
                                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? '正在验证...' : '🔐 进入管理后台'}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handlePlayerLogin} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">您的姓名</label>
                                    <input
                                        type="text"
                                        value={playerName}
                                        onChange={e => setPlayerName(e.target.value)}
                                        placeholder="请输入球队中的注册姓名"
                                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-300 mb-2">队员密码</label>
                                    <div className="relative">
                                        <input
                                            type={showPwd ? 'text' : 'password'}
                                            value={playerPwd}
                                            onChange={e => setPlayerPwd(e.target.value)}
                                            placeholder="请输入队内统一密码"
                                            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPwd(!showPwd)}
                                            className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                                        >
                                            {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? '正在验证...' : '⚽ 查看球队数据'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                <p className="text-center text-slate-500 text-xs mt-6">
                    © 大连理工大学苏州校友会足球队
                </p>
            </div>
        </div>
    )
}
