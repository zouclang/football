"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X, Search, Filter } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { saveMatch, deleteMatch, getLeagueNames } from '@/lib/actions/match'
import { format } from 'date-fns'
import { Pagination } from './Pagination'

type PlayerData = {
    id: string
    name: string
    profilePhoto: string | null
    isActive: boolean
    isMember: boolean
}

type MatchClientProps = {
    initialMatches: any[]
    players: PlayerData[]
    unfinishedTournaments: any[]
    filterTournamentName?: string
    autoEditMatchId?: string
    allTournaments: any[]
}

export function MatchClient({ initialMatches, players, unfinishedTournaments, filterTournamentName, autoEditMatchId, allTournaments }: MatchClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    // 从 URL 中同步当前搜索状态
    const currentYear = searchParams.get('year') || 'ALL'
    const currentTournamentId = searchParams.get('tournamentId') || ''
    const currentOpponent = searchParams.get('opponent') || ''

    const [opponentInput, setOpponentInput] = useState(currentOpponent)
    const [isOpen, setIsOpen] = useState(false)
    const [editingMatch, setEditingMatch] = useState<any | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    useEffect(() => {
        if (autoEditMatchId) {
            const matchToEdit = initialMatches.find(m => m.id === autoEditMatchId)
            if (matchToEdit) {
                setEditingMatch(matchToEdit)
                setIsOpen(true)
            }
        }
    }, [autoEditMatchId, initialMatches])

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

    const getTypeLabel = (type: string, leagueName?: string | null) => {
        switch (type) {
            case 'LEAGUE': return leagueName ? `高校联赛 (${leagueName})` : '高校联赛'
            case 'FRIENDLY': return '热身赛'
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

    const paginatedMatches = initialMatches.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        赛事与考勤
                    </h1>
                </div>
                <button
                    onClick={() => handleOpen()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> 记录新比赛
                </button>
            </div>

            {/* 复合筛选工具栏 */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">筛选:</span>
                </div>

                {/* 年度筛选 */}
                <select
                    value={currentYear}
                    onChange={(e) => {
                        const params = new URLSearchParams(searchParams.toString())
                        params.set('year', e.target.value)
                        params.set('page', '1') // 重置分页
                        router.push(`/matches?${params.toString()}`)
                    }}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-emerald-500 outline-none"
                >
                    <option value="ALL">全部年份</option>
                    <option value="2026">2026 年度</option>
                    <option value="2025">2025 年度</option>
                </select>

                {/* 赛事筛选 */}
                <select
                    value={currentTournamentId}
                    onChange={(e) => {
                        const params = new URLSearchParams(searchParams.toString())
                        if (e.target.value) params.set('tournamentId', e.target.value)
                        else params.delete('tournamentId')
                        params.set('page', '1')
                        router.push(`/matches?${params.toString()}`)
                    }}
                    className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:ring-emerald-500 outline-none max-w-[200px]"
                >
                    <option value="">所有赛事/杯赛</option>
                    <option value="FRIENDLY">热身赛</option>
                    {allTournaments.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>

                {/* 对手名搜索 */}
                <div className="relative flex-grow max-w-xs">
                    <input
                        type="text"
                        placeholder="搜索对手球队名称..."
                        value={opponentInput}
                        onChange={(e) => setOpponentInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                const params = new URLSearchParams(searchParams.toString())
                                if (opponentInput) params.set('opponent', opponentInput)
                                else params.delete('opponent')
                                params.set('page', '1')
                                router.push(`/matches?${params.toString()}`)
                            }
                        }}
                        className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 focus:ring-emerald-500 outline-none"
                    />
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>

                <button
                    onClick={() => {
                        const params = new URLSearchParams(searchParams.toString())
                        if (opponentInput) params.set('opponent', opponentInput)
                        else params.delete('opponent')
                        params.set('page', '1')
                        router.push(`/matches?${params.toString()}`)
                    }}
                    className="text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-4 py-2 rounded-lg transition-colors"
                >
                    搜索
                </button>

                {(currentYear !== 'ALL' || currentTournamentId !== '' || currentOpponent !== '') && (
                    <button
                        onClick={() => {
                            setOpponentInput('')
                            router.push('/matches')
                        }}
                        className="text-sm text-slate-500 hover:text-rose-600 font-medium ml-auto"
                    >
                        清空所有筛选
                    </button>
                )}
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
                        {paginatedMatches.map(match => (
                            <tr key={match.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">
                                    {format(new Date(match.date), 'yyyy-MM-dd')}
                                </td>
                                <td className="px-6 py-4">{match.opponent}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {getTypeLabel(match.type, match.leagueName)}
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
                <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={initialMatches.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size)
                        setCurrentPage(1)
                    }}
                    pageSizeOptions={[10, 20, 50, 100]}
                />
            </div>

            {isOpen && (
                <MatchFormModal
                    match={editingMatch}
                    players={players}
                    unfinishedTournaments={unfinishedTournaments}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}

function MatchFormModal({ match, players, unfinishedTournaments, onClose }: { match: any | null, players: any[], unfinishedTournaments: any[], onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [showAllPlayers, setShowAllPlayers] = useState(false)

    // 初始化时从关联的 Attendances 中还原 goals/assists/fee 数据，或默认为空状态 {}
    const initialAtts = match?.attendances?.reduce((acc: any, a: any) => {
        acc[a.userId] = { goals: a.goals || 0, assists: a.assists || 0, fee: a.fee || 0 }
        return acc
    }, {} as Record<string, { goals: number, assists: number, fee: number }>) || {}

    // 采用对象字典存贮选定的球员以及他在本场的贡献与自发缴费
    const [selectedPlayers, setSelectedPlayers] = useState<Record<string, { goals: number, assists: number, fee: number }>>(initialAtts)

    const [ourScore, setOurScore] = useState<string>(match?.ourScore?.toString() || '')
    const [theirScore, setTheirScore] = useState<string>(match?.theirScore?.toString() || '')
    const [selectedType, setSelectedType] = useState<string>(match?.type || 'LEAGUE')
    const [tournamentId, setTournamentId] = useState<string>(match?.tournamentId || '')
    const [cost, setCost] = useState<string>(match?.cost?.toString() || '')

    const togglePlayer = (id: string) => {
        setSelectedPlayers(prev => {
            const newObj = { ...prev }
            if (newObj[id]) {
                delete newObj[id] // 如果已被选，则取消
            } else {
                newObj[id] = { goals: 0, assists: 0, fee: 0 } // 新增则重置默认
            }
            return newObj
        })
    }

    const updateStats = (id: string, field: 'goals' | 'assists', delta: number, e: React.MouseEvent) => {
        e.stopPropagation() // 防止触发 togglePlayer
        setSelectedPlayers(prev => {
            if (!prev[id]) return prev
            const newObj = { ...prev }
            const newVal = newObj[id][field] + delta
            if (newVal >= 0) {
                newObj[id] = { ...newObj[id], [field]: newVal }
            }
            return newObj
        })
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)

            const parsedOurScore = ourScore ? parseInt(ourScore, 10) : null
            const parsedTheirScore = theirScore ? parseInt(theirScore, 10) : null

            let calculatedResult = null
            if (parsedOurScore !== null && parsedTheirScore !== null) {
                if (parsedOurScore > parsedTheirScore) calculatedResult = 'WIN'
                else if (parsedOurScore === parsedTheirScore) calculatedResult = 'DRAW'
                else calculatedResult = 'LOSS'
            }

            const totalPlayerGoals = Object.values(selectedPlayers).reduce((sum, stats) => sum + stats.goals, 0)
            if (parsedOurScore !== null || totalPlayerGoals > 0) {
                if (parsedOurScore !== totalPlayerGoals) {
                    alert(`我方总进球数(${parsedOurScore || 0})与球员进球数之和(${totalPlayerGoals})不匹配，请检查输入！`)
                    setLoading(false)
                    return
                }
            }

            await saveMatch({
                id: match?.id,
                date: formData.get('date') as string,
                opponent: formData.get('opponent') as string,
                type: selectedType,
                tournamentId: selectedType === 'LEAGUE' ? tournamentId : null,
                cost: selectedType === 'FRIENDLY' && cost ? parseFloat(cost) : 0,
                ourScore: parsedOurScore,
                theirScore: parsedTheirScore,
                result: calculatedResult,
                attendances: Object.entries(selectedPlayers).map(([userId, stats]) => ({
                    userId,
                    goals: stats.goals,
                    assists: stats.assists,
                    fee: selectedType === 'FRIENDLY' ? stats.fee : 0
                }))
            })
            onClose()
        } catch (e) {
            console.error(e)
            alert('保存失败')
        } finally {
            setLoading(false)
        }
    }

    // 动态截断受保护的可展示人员名单
    const activeTourney = unfinishedTournaments.find(t => t.id === tournamentId)
    const tourneyPlayerIds = activeTourney ? new Set(activeTourney.players?.map((p: any) => p.id) || []) : new Set()

    let displayPlayers = players
    if (selectedType === 'LEAGUE') {
        if (tournamentId) {
            displayPlayers = players.filter(p => tourneyPlayerIds.has(p.id))
        } else {
            // 没有选择赛事时不允许直接拉所有人员
            displayPlayers = []
        }
    } else {
        // 热身赛：展示逻辑
        if (match?.id) {
            // 编辑状态：未勾选“全部”时，只展示已选中的人员（不管是否隐退）
            displayPlayers = showAllPlayers
                ? players
                : players.filter(p => !!selectedPlayers[p.id])
        } else {
            // 新增状态：未勾选“全部”时，展示活跃球员及已经被选中的隐退球员
            displayPlayers = showAllPlayers
                ? players
                : players.filter(p => p.isActive !== false || !!selectedPlayers[p.id])
        }
    }

    // 让已被勾选的人员始终排在花名册的最前面
    displayPlayers = [...displayPlayers].sort((a, b) => {
        const aSelected = !!selectedPlayers[a.id]
        const bSelected = !!selectedPlayers[b.id]
        if (aSelected && !bSelected) return -1
        if (!aSelected && bSelected) return 1
        return 0
    })

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
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-slate-700 mb-1">赛事类型 *</label>
                                <select
                                    value={selectedType}
                                    onChange={e => setSelectedType(e.target.value)}
                                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500"
                                >
                                    <option value="LEAGUE">高校联赛</option>
                                    <option value="FRIENDLY">热身赛</option>
                                </select>
                            </div>
                            {selectedType === 'LEAGUE' && (
                                <div className="col-span-2 sm:col-span-1 border-l-2 border-emerald-400 pl-4 bg-emerald-50/30 rounded-r-md">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        依附高校联赛系列 <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={tournamentId}
                                        onChange={e => setTournamentId(e.target.value)}
                                        required
                                        className="w-full rounded-md border border-emerald-200 px-3 py-2 text-slate-900 focus:outline-emerald-500 bg-white"
                                    >
                                        <option value="">-- 选择进行中的联赛 --</option>
                                        {unfinishedTournaments.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            {selectedType === 'FRIENDLY' && (
                                <div className="col-span-2 sm:col-span-1 border-l-2 border-amber-400 pl-4 bg-amber-50/30 rounded-r-md">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">本场场地费总成本 (¥)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={cost}
                                        onChange={e => setCost(e.target.value)}
                                        placeholder="例如：500"
                                        className="w-full rounded-md border border-amber-200 px-3 py-2 text-slate-900 focus:outline-amber-500 bg-white"
                                    />
                                </div>
                            )}
                        </div>

                        {/* 比赛结果：独立的一块区域 */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                            <h3 className="font-semibold text-slate-800 text-sm">比赛结果 (选填)</h3>
                            <div className="grid grid-cols-2 gap-4">
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
                            </div>
                        </div>

                        {/* 出勤人员 */}
                        <div className="pt-2">
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-sm font-medium text-slate-700">出勤人员及本场数据 (已选 {Object.keys(selectedPlayers).length} 人)</label>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600">
                                        <input
                                            type="checkbox"
                                            checked={showAllPlayers}
                                            onChange={(e) => setShowAllPlayers(e.target.checked)}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        显示所有球员 (含隐退)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const allObj: Record<string, { goals: number, assists: number, fee: number }> = {}
                                            displayPlayers.forEach(p => allObj[p.id] = { goals: 0, assists: 0, fee: selectedType === 'FRIENDLY' ? 0 : 0 })
                                            setSelectedPlayers(allObj)
                                        }}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        全选(初始数据)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedPlayers({})}
                                        className="text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        清空
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {displayPlayers.length === 0 && selectedType === 'LEAGUE' && (
                                    <div className="col-span-full p-4 text-center bg-emerald-50/50 rounded-xl border border-emerald-100/50">
                                        <p className="text-sm text-emerald-600">请先在上方【依附高校联赛系列】中选择已报名的赛事对象！</p>
                                    </div>
                                )}
                                {displayPlayers.map(player => {
                                    const isSelected = !!selectedPlayers[player.id]
                                    const stats = selectedPlayers[player.id]
                                    return (
                                        <div
                                            key={player.id}
                                            onClick={() => togglePlayer(player.id)}
                                            className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center gap-2 transition-colors ${isSelected ? 'bg-emerald-50 border-emerald-500 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3 w-full">
                                                {player.profilePhoto ? (
                                                    <img src={player.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0">
                                                        {player.name[0]}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-slate-900 grow">{player.name}</span>
                                            </div>

                                            {/* 数字增减控件 (仅选中时显示) */}
                                            {isSelected && stats && (
                                                <div className="w-full mt-2 space-y-1.5 pt-2 border-t border-emerald-100">
                                                    {selectedType === 'FRIENDLY' && !player.isMember && (
                                                        <div className="flex justify-between items-center text-xs bg-amber-50/80 px-2 py-1.5 rounded-md border border-amber-100">
                                                            <span className="text-amber-800 font-medium whitespace-nowrap">人均实费：</span>
                                                            <div className="flex items-center gap-1">
                                                                <span className="text-amber-600/70">¥</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={stats.fee === 0 ? '' : stats.fee}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value) || 0
                                                                        setSelectedPlayers(prev => ({
                                                                            ...prev,
                                                                            [player.id]: { ...prev[player.id], fee: val }
                                                                        }))
                                                                    }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-14 p-0.5 text-center text-xs font-semibold border-b border-amber-300 bg-transparent focus:outline-none focus:border-amber-600 text-amber-900"
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-600 font-medium whitespace-nowrap">进球：</span>
                                                        <div className="flex items-center border border-slate-300 rounded bg-white">
                                                            <button type="button" onClick={(e) => updateStats(player.id, 'goals', -1, e)} className="px-2 py-0.5 hover:bg-slate-100 text-slate-500">-</button>
                                                            <span className="w-6 text-center font-bold text-slate-700">{stats.goals}</span>
                                                            <button type="button" onClick={(e) => updateStats(player.id, 'goals', 1, e)} className="px-2 py-0.5 hover:bg-slate-100 text-slate-500">+</button>
                                                        </div>
                                                    </div>
                                                    <div className="flex justify-between items-center text-xs">
                                                        <span className="text-slate-600 font-medium whitespace-nowrap">助攻：</span>
                                                        <div className="flex items-center border border-slate-300 rounded bg-white">
                                                            <button type="button" onClick={(e) => updateStats(player.id, 'assists', -1, e)} className="px-2 py-0.5 hover:bg-slate-100 text-slate-500">-</button>
                                                            <span className="w-6 text-center font-bold text-slate-700">{stats.assists}</span>
                                                            <button type="button" onClick={(e) => updateStats(player.id, 'assists', 1, e)} className="px-2 py-0.5 hover:bg-slate-100 text-slate-500">+</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
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
