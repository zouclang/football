"use client"

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { savePlayer, deletePlayer, type PlayerInput } from '@/lib/actions/player'
import { uploadToStorage } from '@/lib/actions/storage'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Pagination } from './Pagination'

// #7: 使用具体类型而非 any
type Player = {
    id: string
    name: string
    birthDate: string | null
    enrollmentYear: string | null
    major: string | null
    jerseyNumber: string | null
    jerseySize: string | null
    profilePhoto: string | null
    suzhouProofType: string | null
    suzhouProofUrl: string | null
    educationProofType: string | null
    educationProofUrl: string | null
    positions: string | null
    teamRole: string | null
    personalBalance: number
    attendanceRate?: string
    yearlyAppearances?: number
    yearlyGoals?: number
    yearlyAssists?: number
    isActive: boolean
    isMember: boolean
}

export function PlayerClient({ initialPlayers, currentYear }: { initialPlayers: Player[], currentYear?: string }) {
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('active')
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
    // #10: 用 deletingId 跟踪正在删除的球员，防止重复点击
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // 分页态
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const handleOpen = (player?: Player) => {
        if (player) setEditingPlayer(player)
        else setEditingPlayer(null)
        setIsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('确定要删除这位球员吗？')) {
            setDeletingId(id)
            try {
                await deletePlayer(id)
            } finally {
                setDeletingId(null)
            }
        }
    }

    const filteredPlayers = initialPlayers.filter(p => {
        if (filterActive === 'all') return true;
        if (filterActive === 'active') return p.isActive;
        return !p.isActive;
    })

    const paginatedPlayers = filteredPlayers.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900">球员管理</h1>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <select
                            value={filterActive}
                            onChange={(e) => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
                            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="active">活跃成员</option>
                            <option value="all">全员</option>
                            <option value="inactive">隐出休眠状态</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-slate-600">考绩筛选:</label>
                        <select
                            value={currentYear || new Date().getFullYear().toString()}
                            onChange={(e) => {
                                const y = e.target.value
                                router.push(`/players${y === 'ALL' ? '?year=ALL' : `?year=${y}`}`)
                            }}
                            className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="ALL">全部</option>
                            {[...Array(5).keys()].map(i => {
                                const year = (new Date().getFullYear() - i).toString();
                                return <option key={year} value={year}>{year}年</option>
                            })}
                        </select>
                    </div>
                    <button
                        onClick={() => handleOpen()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> 新增球员
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium min-w-[60px]">序号</th>
                            <th className="px-6 py-4 font-medium text-center">号码</th>
                            <th className="px-6 py-4 font-medium">球员</th>
                            <th className="px-6 py-4 font-medium">入学年份 / 学院专业</th>
                            <th className="px-6 py-4 font-medium">个人账户结余</th>
                            <th className="px-6 py-4 font-medium text-center whitespace-nowrap">{currentYear === 'ALL' ? '生涯累计' : `${currentYear || new Date().getFullYear()}年`}<br />出勤率</th>
                            <th className="px-6 py-4 font-medium text-center whitespace-nowrap">{currentYear === 'ALL' ? '生涯累计' : `${currentYear || new Date().getFullYear()}年`}<br />出勤次数</th>
                            <th className="px-6 py-4 font-medium text-center whitespace-nowrap">{currentYear === 'ALL' ? '生涯累计' : `${currentYear || new Date().getFullYear()}年`}<br />进球数</th>
                            <th className="px-6 py-4 font-medium text-center whitespace-nowrap">{currentYear === 'ALL' ? '生涯累计' : `${currentYear || new Date().getFullYear()}年`}<br />助攻数</th>
                            <th className="px-6 py-4 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedPlayers.map((player, index) => (
                            <tr key={player.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 text-slate-400 font-medium">
                                    {(currentPage - 1) * pageSize + index + 1}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="text-lg font-bold text-slate-700">
                                        {player.jerseyNumber || '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Link href={`/players/${player.id}`} className="shrink-0 transition-opacity hover:opacity-80">
                                            {player.profilePhoto ? (
                                                <img src={player.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                    {player.name[0]}
                                                </div>
                                            )}
                                        </Link>
                                        <div>
                                            <Link href={`/players/${player.id}`} className="font-medium text-slate-900 hover:text-emerald-600 hover:underline">
                                                {player.name}
                                            </Link>
                                            {player.isActive === false && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                                                    休长假
                                                </span>
                                            )}
                                            {player.teamRole && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                    {player.teamRole}
                                                </span>
                                            )}
                                            {player.isMember && (
                                                <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-fuchsia-100 text-fuchsia-800 border border-fuchsia-200">
                                                    会员
                                                </span>
                                            )}
                                            <div className="text-xs text-slate-500 mt-0.5">
                                                {player.positions && <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">{player.positions.split(',').join('/')}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-slate-700">{player.enrollmentYear || '-'} 级</div>
                                    <div className="text-xs text-slate-500">{player.major || '-'}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={player.personalBalance < 0 ? 'text-red-500 font-semibold' : 'text-slate-900'}>
                                        ¥{player.personalBalance.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        {player.attendanceRate || '0%'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center font-semibold text-slate-600">
                                    {player.yearlyAppearances || 0}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-amber-600">
                                    {player.yearlyGoals || 0}
                                </td>
                                <td className="px-6 py-4 text-center font-bold text-blue-600">
                                    {player.yearlyAssists || 0}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => handleOpen(player)} className="text-blue-600 hover:text-blue-800 p-2">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    {/* #10: 删除时禁用按钮，防止重复点击 */}
                                    <button
                                        onClick={() => handleDelete(player.id)}
                                        disabled={deletingId === player.id}
                                        className="text-red-600 hover:text-red-800 p-2 ml-2 disabled:opacity-40"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {initialPlayers.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">暂无登记球员</td>
                            </tr>
                        )}
                    </tbody>
                </table >
                <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filteredPlayers.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size)
                        setCurrentPage(1)
                    }}
                />
            </div >

            {isOpen && (
                <PlayerFormModal
                    player={editingPlayer}
                    onClose={() => setIsOpen(false)}
                />
            )
            }
        </div >
    )
}

function PlayerFormModal({ player, onClose }: { player: Player | null, onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [photo, setPhoto] = useState<File | null>(null)
    const [selectedPositions, setSelectedPositions] = useState<Set<string>>(
        new Set(player?.positions ? player.positions.split(',') : [])
    )

    const togglePosition = (pos: string) => {
        const next = new Set(selectedPositions)
        if (next.has(pos)) next.delete(pos)
        else next.add(pos)
        setSelectedPositions(next)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)

            let profileUrl = player?.profilePhoto || null

            if (photo) {
                profileUrl = await uploadToStorage(photo) || profileUrl
            }

            const playerInput: PlayerInput = {
                id: player?.id, // Only include id if editing an existing player
                name: formData.get('name') as string,
                birthDate: formData.get('birthDate') as string || null,
                enrollmentYear: formData.get('enrollmentYear') as string || null,
                major: formData.get('major') as string || null,
                jerseyNumber: formData.get('jerseyNumber') as string || null,
                jerseySize: formData.get('jerseySize') as string || null,
                profilePhoto: profileUrl,
                suzhouProofType: player?.suzhouProofType || null,
                suzhouProofUrl: player?.suzhouProofUrl || null,
                educationProofType: player?.educationProofType || null,
                educationProofUrl: player?.educationProofUrl || null,
                positions: selectedPositions.size > 0 ? Array.from(selectedPositions).join(',') : null,
                teamRole: formData.get('teamRole') as string || null,
                isActive: formData.get('isActive') === 'false' ? false : true,
                isMember: formData.get('isMember') === 'true',
            }

            await savePlayer(playerInput)
            onClose() // Close modal on success

        } catch (e) {
            console.error(e)
            alert('保存失败')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900">{player ? '编辑球员' : '新增球员'}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">姓名 *</label>
                            <input name="name" defaultValue={player?.name} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">队内职务</label>
                            <select name="teamRole" defaultValue={player?.teamRole || ''} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-emerald-500">
                                <option value="">-- 无职务 --</option>
                                <option value="队长">队长</option>
                                <option value="副队长">副队长</option>
                                <option value="领队">领队</option>
                                <option value="教练">教练</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">活跃状态</label>
                            <select name="isActive" defaultValue={player?.isActive === false ? 'false' : 'true'} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-emerald-500">
                                <option value="true">活跃 (参与活动)</option>
                                <option value="false">隐退 (休假中)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">是否正式会员</label>
                            <select name="isMember" defaultValue={player?.isMember ? 'true' : 'false'} className="w-full rounded-md border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:outline-emerald-500">
                                <option value="true">是 (享有会员池贴补)</option>
                                <option value="false">否 (普通编外人员)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">出生年月 (YYYY-MM)</label>
                            <input name="birthDate" defaultValue={player?.birthDate || ''} type="month" className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">入学年份 (YYYY)</label>
                            <input name="enrollmentYear" defaultValue={player?.enrollmentYear || ''} placeholder="例如: 2010" className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">学院及专业</label>
                            <input name="major" defaultValue={player?.major || ''} placeholder="例如: 机械工程学院 机械制造" className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">球衣号码</label>
                            <input name="jerseyNumber" defaultValue={player?.jerseyNumber || ''} placeholder="例如: 10" className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">球衣尺码</label>
                            <select name="jerseySize" defaultValue={player?.jerseySize || 'L'} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500">
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="2XL">2XL</option>
                                <option value="3XL">3XL</option>
                                <option value="4XL">4XL</option>
                                <option value="5XL">5XL</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t border-slate-100">
                        <label className="block text-sm font-medium text-slate-700">场上位置 (可多选)</label>
                        <div className="flex flex-wrap gap-2">
                            {['前锋', '中场', '左边前', '右边前', '中后卫', '边后卫', '守门员'].map(pos => (
                                <button
                                    key={pos}
                                    type="button"
                                    onClick={() => togglePosition(pos)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${selectedPositions.has(pos)
                                        ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                >
                                    {pos}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">球员照片</label>
                            <div className="flex items-center gap-4">
                                <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                                {player?.profilePhoto && !photo && <span className="text-xs text-emerald-600">已有照片,会保持原样</span>}
                            </div>
                        </div>

                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">取消</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                            {loading ? '保存中...' : '确认保存'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
