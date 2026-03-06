"use client"

import { useState, useEffect } from 'react'

import { Trophy, Plus, Calendar as CalendarIcon, Edit2, Trash2, X, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { saveTournament, deleteTournament } from '@/lib/actions/tournament'
import { Pagination } from './Pagination'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Tournament } from '@prisma/client'

type PlayerInfo = {
    id: string
    name: string
    jerseyNumber: string | null
    isActive: boolean
    isRetired: boolean
}

type TournamentWithPlayers = Tournament & { players: PlayerInfo[] }

type TournamentClientProps = {
    initialTournaments: TournamentWithPlayers[]
    players: PlayerInfo[]
    role: 'admin' | 'player'
}

export function TournamentClient({ initialTournaments, players, role }: TournamentClientProps) {
    const router = useRouter()
    // 去除多余的内部状态维护，直接穿透属性以保证 `router.refresh()` 之后页面能捕获最新下发的属性
    const tournaments = initialTournaments

    const [isOpen, setIsOpen] = useState(false)
    const [editingTx, setEditingTx] = useState<TournamentWithPlayers | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)

    const [isMounted, setIsMounted] = useState(false)
    useEffect(() => setIsMounted(true), [])

    const handleOpen = (item?: TournamentWithPlayers) => {
        if (item) setEditingTx(item)
        else setEditingTx(null)
        setIsOpen(true)
    }

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`🔴 警告：作废 ${name} 赛事条目，数据将不可恢复！\n\n您确定要删除此赛事记录吗？`)) {
            setDeletingId(id)
            try {
                await deleteTournament(id)
                router.refresh()
            } catch (e) {
                alert("删除失败，请重试")
            } finally {
                setDeletingId(null)
            }
        }
    }

    return (
        <div className="space-y-6">
            {!isMounted ? (
                <div className="flex items-center justify-center p-12 text-slate-400 animate-pulse">
                    加载赛事数据中...
                </div>
            ) : (
                <>
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-3xl font-bold gap-2 flex items-center text-slate-900">
                                <Trophy className="w-8 h-8 text-emerald-500" />
                                赛事管理
                            </h1>
                            <p className="text-slate-500 mt-2">统揽从大型杯赛到系列联赛的所有时间跨度和经费台账记录。</p>
                        </div>
                        {role === 'admin' && (
                            <button
                                onClick={() => handleOpen()}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
                            >
                                <Plus className="w-5 h-5" />
                                新建赛事记录
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((t) => (
                            <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <Link
                                            href={`/matches?tournamentId=${t.id}`}
                                            className="font-bold text-lg text-slate-800 break-words hover:text-emerald-600 hover:underline transition-colors"
                                        >
                                            {t.name}
                                        </Link>
                                        <div className="flex gap-1 ml-4 shrink-0">
                                            {role === 'admin' && (
                                                <>
                                                    <button onClick={() => handleOpen(t)} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDelete(t.id, t.name)} disabled={deletingId === t.id} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center text-sm text-slate-500 gap-1.5">
                                        <CalendarIcon className="w-4 h-4" />
                                        {t.startDate ? t.startDate : '待定'} {t.endDate ? `至 ${t.endDate}` : ''}
                                    </div>
                                    {t.finalRank && (
                                        <div className="mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                                            🏆 最终成绩: {t.finalRank}
                                        </div>
                                    )}
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="grid grid-cols-3 gap-4 text-center divide-x divide-slate-100">
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">报名费</p>
                                            <p className="font-semibold text-slate-800">¥{t.entryFee.toFixed(1)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">保证金</p>
                                            <p className="font-semibold text-slate-800">¥{t.deposit.toFixed(1)}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 mb-1">各项扣费</p>
                                            <p className="font-semibold text-red-600">¥{t.deduction.toFixed(1)}</p>
                                        </div>
                                    </div>

                                    {t.notes && (
                                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-start gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
                                            <FileText className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
                                            <span className="whitespace-pre-wrap">{t.notes}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {tournaments.length === 0 && (
                            <div className="col-span-full py-16 text-center text-slate-400 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl">
                                <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                <p>还没有记录过任何大型赛事数据，点击上方添加一笔吧！</p>
                            </div>
                        )}
                    </div>

                    <Pagination
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={tournaments.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size)
                            setCurrentPage(1)
                        }}
                    />

                    {isOpen && (
                        <TournamentFormModal
                            initialData={editingTx}
                            players={players}
                            onClose={() => {
                                setIsOpen(false)
                                router.refresh()
                            }}
                        />
                    )}
                </>
            )}
        </div>
    )
}

function TournamentFormModal({ initialData, players, onClose }: { initialData: TournamentWithPlayers | null, players: PlayerInfo[], onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [showInactive, setShowInactive] = useState(false)
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(
        new Set(initialData?.players.map(p => p.id) || [])
    )

    const togglePlayer = (id: string) => {
        const next = new Set(selectedPlayerIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedPlayerIds(next)
    }

    const displayPlayers = [...players]
        .filter(p => !p.isRetired && (showInactive || p.isActive))
        .sort((a, b) => {
            const aSelected = selectedPlayerIds.has(a.id);
            const bSelected = selectedPlayerIds.has(b.id);

            // 1. 已选中球员排在前面
            if (aSelected !== bSelected) {
                return aSelected ? -1 : 1;
            }

            // 2. 基础排序：按号码升序
            const numA = parseInt(a.jerseyNumber || '999', 10);
            const numB = parseInt(b.jerseyNumber || '999', 10);
            if (numA !== numB) {
                return numA - numB;
            }

            // 3. 姓名兜底
            return a.name.localeCompare(b.name, 'zh-Hans-CN-u-co-pinyin');
        });

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)

        const formData = new FormData(e.currentTarget)
        try {
            await saveTournament({
                id: initialData?.id,
                name: formData.get('name') as string,
                startDate: formData.get('startDate') as string || null,
                endDate: formData.get('endDate') as string || null,
                entryFee: Number(formData.get('entryFee')) || 0,
                deposit: Number(formData.get('deposit')) || 0,
                deduction: Number(formData.get('deduction')) || 0,
                finalRank: formData.get('finalRank') as string || null,
                notes: formData.get('notes') as string || null,
                playerIds: Array.from(selectedPlayerIds)
            })
            onClose() // 外层绑定了 `router.refresh()`
        } catch (error) {
            console.error(error)
            alert("保存失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-slate-100 flex justify-between items-center p-6 z-10">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        {initialData ? '✍️ 编辑赛事档案' : '🏆 创建赛事档案'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                赛事全名 <span className="text-red-500">*</span>
                            </label>
                            <input
                                name="name"
                                required
                                defaultValue={initialData?.name || ''}
                                placeholder="例：2026年苏州第三届校友杯足球锦标赛"
                                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">开始日期</label>
                                <input
                                    name="startDate"
                                    type="date"
                                    defaultValue={initialData?.startDate || ''}
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">结束日期</label>
                                <input
                                    name="endDate"
                                    type="date"
                                    defaultValue={initialData?.endDate || ''}
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">报名费 (¥)</label>
                                <input
                                    name="entryFee"
                                    type="number"
                                    step="0.01"
                                    defaultValue={initialData?.entryFee || ''}
                                    placeholder="0"
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">保证金 (¥)</label>
                                <input
                                    name="deposit"
                                    type="number"
                                    step="0.01"
                                    defaultValue={initialData?.deposit || ''}
                                    placeholder="0"
                                    className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1 text-red-600">已产生的扣费</label>
                                <input
                                    name="deduction"
                                    type="number"
                                    step="0.01"
                                    defaultValue={initialData?.deduction || ''}
                                    placeholder="0"
                                    className="w-full border border-red-300 bg-red-50 rounded-xl p-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 text-red-700"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">这届赛事的最终战绩/成果？</label>
                            <input
                                name="finalRank"
                                defaultValue={initialData?.finalRank || ''}
                                placeholder="例：打入八强 (或：卫冕冠军)"
                                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">情况备注 / 备忘说明</label>
                            <textarea
                                name="notes"
                                defaultValue={initialData?.notes || ''}
                                rows={3}
                                placeholder="例如：红黄牌罚款在第3轮扣了100块..."
                                className="w-full border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-slate-700">圈定本赛事的报名球员库 ({selectedPlayerIds.size} 人)</label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">包含隐退人员</span>
                                    <input
                                        type="checkbox"
                                        checked={showInactive}
                                        onChange={(e) => setShowInactive(e.target.checked)}
                                        className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2 flex-wrap max-h-[160px] overflow-y-auto p-3 border border-slate-200 rounded-xl bg-slate-50">
                                {displayPlayers.map(p => {
                                    const isSelected = selectedPlayerIds.has(p.id)
                                    return (
                                        <button
                                            key={p.id}
                                            type="button"
                                            onClick={() => togglePlayer(p.id)}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isSelected
                                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800 shadow-sm'
                                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                                                }`}
                                        >
                                            {p.jerseyNumber ? `#${p.jerseyNumber} ${p.name}` : p.name}
                                        </button>
                                    )
                                })}
                                {displayPlayers.length === 0 && <span className="text-sm text-slate-400">当前没有可以挑选注册参赛的球员。</span>}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">选定的人员将作为在这项系列联赛里执行考勤点将的唯一受限白名单库。</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 border border-slate-300 font-medium rounded-xl text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-medium disabled:opacity-50 transition-colors flex flex-row shadow-sm shadow-emerald-200"
                        >
                            {loading ? '正在写入...' : '保存归档'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
