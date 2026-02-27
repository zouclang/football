"use client"

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { saveMatch, deleteMatch } from '@/lib/actions/match'
import { format } from 'date-fns'

type MatchClientProps = {
    initialMatches: any[]
    players: any[]
}

export function MatchClient({ initialMatches, players }: MatchClientProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [editingMatch, setEditingMatch] = useState<any | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleOpen = (match?: any) => {
        if (match) setEditingMatch(match)
        else setEditingMatch(null)
        setIsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('确定要删除这场比赛记录吗？')) {
            setDeletingId(id)
            try {
                await deleteMatch(id)
            } finally {
                setDeletingId(null)
            }
        }
    }

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'LEAGUE': return '校友会联赛'
            case 'INTERNAL_WARMUP': return '内部热身赛'
            case 'EXTERNAL_FRIENDLY': return '对外友谊赛'
            default: return type
        }
    }

    const getResultBadge = (result: string | null) => {
        if (!result) return <span className="text-slate-400">-</span>
        if (result === 'WIN') return <span className="inline-block px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-bold">胜</span>
        if (result === 'DRAW') return <span className="inline-block px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">平</span>
        if (result === 'LOSS') return <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-xs font-bold">负</span>
        return null
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900">赛事与考勤</h1>
                <button
                    onClick={() => handleOpen()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> 记录新比赛
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium">比赛日期</th>
                            <th className="px-6 py-4 font-medium">对手</th>
                            <th className="px-6 py-4 font-medium">类型</th>
                            <th className="px-6 py-4 font-medium text-center">赛果</th>
                            <th className="px-6 py-4 font-medium text-center">比分</th>
                            <th className="px-6 py-4 font-medium text-center">出勤人数</th>
                            <th className="px-6 py-4 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {initialMatches.map(match => (
                            <tr key={match.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {format(new Date(match.date), 'yyyy-MM-dd')}
                                </td>
                                <td className="px-6 py-4">{match.opponent}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {getTypeLabel(match.type)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {getResultBadge(match.result)}
                                </td>
                                <td className="px-6 py-4 text-center whitespace-nowrap">
                                    {match.ourScore != null && match.theirScore != null ? (
                                        <span className="font-semibold">{match.ourScore} : {match.theirScore}</span>
                                    ) : '-'}
                                </td>
                                <td className="px-6 py-4 text-center">{match.attendances.length} 人</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleOpen(match)} className="text-blue-600 hover:text-blue-800 p-2">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(match.id)}
                                        disabled={deletingId === match.id}
                                        className="text-red-600 hover:text-red-800 p-2 ml-2 disabled:opacity-40"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {initialMatches.length === 0 && (
                            <tr>
                                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">暂无比赛记录</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isOpen && (
                <MatchFormModal
                    match={editingMatch}
                    players={players}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}

function MatchFormModal({ match, players, onClose }: { match: any | null, players: any[], onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const initialAtts = match?.attendances?.map((a: any) => a.userId) || []
    const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set(initialAtts))

    const [ourScore, setOurScore] = useState<string>(match?.ourScore?.toString() || '')
    const [theirScore, setTheirScore] = useState<string>(match?.theirScore?.toString() || '')
    const [result, setResult] = useState<string>(match?.result || '')

    const togglePlayer = (id: string) => {
        const newSet = new Set(selectedPlayers)
        if (newSet.has(id)) newSet.delete(id)
        else newSet.add(id)
        setSelectedPlayers(newSet)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            await saveMatch({
                id: match?.id,
                date: formData.get('date') as string,
                opponent: formData.get('opponent') as string,
                type: formData.get('type') as string,
                ourScore: ourScore ? parseInt(ourScore, 10) : null,
                theirScore: theirScore ? parseInt(theirScore, 10) : null,
                result: result || null,
                attendances: Array.from(selectedPlayers)
            })
            onClose()
        } catch (e) {
            console.error(e)
            alert('保存失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
                    <h2 className="text-xl font-bold text-slate-900">{match ? '编辑比赛与考勤' : '记录新比赛'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto space-y-6 flex-1 border-b border-slate-100">
                        {/* 基本信息 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">比赛日期 *</label>
                                <input
                                    name="date"
                                    type="date"
                                    defaultValue={match ? format(new Date(match.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')}
                                    required
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">对手 *</label>
                                <input
                                    name="opponent"
                                    defaultValue={match?.opponent}
                                    required
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">赛事类型 *</label>
                                <select
                                    name="type"
                                    defaultValue={match?.type || 'INTERNAL_WARMUP'}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500"
                                >
                                    <option value="LEAGUE">高校联赛</option>
                                    <option value="INTERNAL_WARMUP">内部热身赛</option>
                                    <option value="EXTERNAL_FRIENDLY">对外约战</option>
                                </select>
                            </div>
                        </div>

                        {/* 比赛结果：独立的一块区域 */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                            <h3 className="font-semibold text-slate-800 text-sm">比赛结果 (选填)</h3>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">我方进球</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={ourScore}
                                        onChange={e => setOurScore(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 text-center focus:outline-emerald-500"
                                        placeholder="-"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">对方进球</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={theirScore}
                                        onChange={e => setTheirScore(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 text-center focus:outline-emerald-500"
                                        placeholder="-"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-700 mb-1">胜负结果</label>
                                    <select
                                        value={result}
                                        onChange={e => setResult(e.target.value)}
                                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500 text-center"
                                    >
                                        <option value="">(未录入)</option>
                                        <option value="WIN">胜</option>
                                        <option value="DRAW">平</option>
                                        <option value="LOSS">负</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* 出勤人员 */}
                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-slate-700">出勤人员勾选 (已选 {selectedPlayers.size} 人)</label>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlayers(new Set(players.map(p => p.id)))}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        全选
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlayers(new Set())}
                                        className="text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        清空
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {players.map(player => {
                                    const isSelected = selectedPlayers.has(player.id)
                                    return (
                                        <div
                                            key={player.id}
                                            onClick={() => togglePlayer(player.id)}
                                            className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'
                                                }`}
                                        >
                                            {player.profilePhoto ? (
                                                <img src={player.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                    {player.name[0]}
                                                </div>
                                            )}
                                            <span className="text-sm font-medium text-slate-900">{player.name}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 shrink-0 flex justify-end gap-3 bg-slate-50 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg">取消</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                            {loading ? '保存中...' : '确认保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
