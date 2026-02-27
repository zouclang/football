"use client"

import { useState } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { savePlayer, deletePlayer, type PlayerInput } from '@/lib/actions/player'
import { uploadFile } from '@/lib/actions/upload'

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
    personalBalance: number
    attendanceRate?: string
}

export function PlayerClient({ initialPlayers }: { initialPlayers: Player[] }) {
    const [isOpen, setIsOpen] = useState(false)
    const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
    // #10: 用 deletingId 跟踪正在删除的球员，防止重复点击
    const [deletingId, setDeletingId] = useState<string | null>(null)

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

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900">球员管理</h1>
                <button
                    onClick={() => handleOpen()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> 新增球员
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-4 font-medium">球员</th>
                            <th className="px-6 py-4 font-medium">入学年份 / 专业</th>
                            <th className="px-6 py-4 font-medium">个人账户结余</th>
                            <th className="px-6 py-4 font-medium">出勤率</th>
                            <th className="px-6 py-4 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {initialPlayers.map(player => (
                            <tr key={player.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        {player.profilePhoto ? (
                                            <img src={player.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                                {player.name[0]}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-medium text-slate-900">{player.name}</div>
                                            <div className="text-xs text-slate-500">{player.birthDate || '生日未知'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div>{player.enrollmentYear || '-'} 级</div>
                                    <div className="text-xs text-slate-500">{player.major || '-'}</div>
                                    <div className="text-xs font-semibold text-indigo-500 mt-1">
                                        {player.jerseyNumber ? `#${player.jerseyNumber} (${player.jerseySize || '未知尺码'})` : '-'}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={player.personalBalance < 0 ? 'text-red-500 font-semibold' : 'text-slate-900'}>
                                        ¥{player.personalBalance.toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                        {player.attendanceRate || '0%'}
                                    </span>
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
                </table>
            </div>

            {isOpen && (
                <PlayerFormModal
                    player={editingPlayer}
                    onClose={() => setIsOpen(false)}
                />
            )}
        </div>
    )
}

function PlayerFormModal({ player, onClose }: { player: Player | null, onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [photo, setPhoto] = useState<File | null>(null)
    const [suzhouProof, setSuzhouProof] = useState<File | null>(null)
    const [educationProof, setEducationProof] = useState<File | null>(null)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)

            let profileUrl = player?.profilePhoto || null
            let suzhouUrl = player?.suzhouProofUrl || null
            let eduUrl = player?.educationProofUrl || null

            if (photo) {
                const pData = new FormData(); pData.append('file', photo)
                profileUrl = await uploadFile(pData) || profileUrl
            }
            if (suzhouProof) {
                const sData = new FormData(); sData.append('file', suzhouProof)
                suzhouUrl = await uploadFile(sData) || suzhouUrl
            }
            if (educationProof) {
                const eData = new FormData(); eData.append('file', educationProof)
                eduUrl = await uploadFile(eData) || eduUrl
            }

            await savePlayer({
                id: player?.id,
                name: formData.get('name') as string,
                birthDate: formData.get('birthDate') as string,
                enrollmentYear: formData.get('enrollmentYear') as string,
                major: formData.get('major') as string,
                jerseyNumber: formData.get('jerseyNumber') as string,
                jerseySize: formData.get('jerseySize') as string,
                profilePhoto: profileUrl as string,
                suzhouProofType: formData.get('suzhouProofType') as string,
                suzhouProofUrl: suzhouUrl as string,
                educationProofType: formData.get('educationProofType') as string,
                educationProofUrl: eduUrl as string,
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
                            <label className="block text-sm font-medium text-slate-700 mb-1">出生年月 (YYYY-MM)</label>
                            <input name="birthDate" defaultValue={player?.birthDate || ''} type="month" className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">入学年份</label>
                            <input name="enrollmentYear" defaultValue={player?.enrollmentYear || ''} type="number" className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">专业</label>
                            <input name="major" defaultValue={player?.major || ''} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:outline-emerald-500" />
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

                    <div className="space-y-4 pt-4 border-t border-slate-100">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">球员照片</label>
                            <div className="flex items-center gap-4">
                                <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                                {player?.profilePhoto && !photo && <span className="text-xs text-emerald-600">已有照片,会保持原样</span>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 flex justify-between flex-col">
                                <label className="block text-sm font-medium text-slate-700">在苏证明 (四选一)</label>
                                <select name="suzhouProofType" defaultValue={player?.suzhouProofType || 'NONE'} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900">
                                    <option value="NONE">暂无</option>
                                    <option value="ID_CARD">苏州身份证</option>
                                    <option value="RESIDENCE_PERMIT">苏州居住证</option>
                                    <option value="SOCIAL_SECURITY">苏州社保</option>
                                    <option value="PROPERTY">苏州房产</option>
                                </select>
                                <input type="file" accept="image/*" onChange={(e) => setSuzhouProof(e.target.files?.[0] || null)} className="text-xs w-full" />
                            </div>

                            <div className="space-y-2 flex justify-between flex-col">
                                <label className="block text-sm font-medium text-slate-700">学历证明 (三选一)</label>
                                <select name="educationProofType" defaultValue={player?.educationProofType || 'NONE'} className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900">
                                    <option value="NONE">暂无</option>
                                    <option value="DIPLOMA">毕业证</option>
                                    <option value="DEGREE">学位证照片</option>
                                    <option value="MBA">MBA学生证</option>
                                </select>
                                <input type="file" accept="image/*" onChange={(e) => setEducationProof(e.target.files?.[0] || null)} className="text-xs w-full" />
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
