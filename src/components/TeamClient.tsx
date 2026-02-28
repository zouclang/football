"use client"

import { useState } from 'react'
import { Upload, Save } from 'lucide-react'
import { updateTeamInfo, type TeamInfoInput } from '@/lib/actions/team'
import { uploadToStorage } from '@/lib/actions/storage'

export function TeamClient({ initialData, players = [] }: { initialData: any, players?: any[] }) {
    const [loading, setLoading] = useState(false)
    const [foundationDate, setFoundationDate] = useState(initialData.foundationDate || '')

    // Leadership
    const [captainId, setCaptainId] = useState(initialData.captainId || '')
    const [leaderMode, setLeaderMode] = useState<'PLAYER' | 'NON_PLAYER'>(initialData.leaderId ? 'PLAYER' : 'NON_PLAYER')
    const [leaderId, setLeaderId] = useState(initialData.leaderId || '')
    const [leaderName, setLeaderName] = useState(initialData.leaderName || '')

    // Photos
    const [groupPhoto, setGroupPhoto] = useState<File | null>(null)
    const [newHighlights, setNewHighlights] = useState<FileList | null>(null)

    const existingHighlights = initialData.highlightPhotos ? JSON.parse(initialData.highlightPhotos) : []

    const handleSave = async () => {
        setLoading(true)
        try {
            let groupUrl = initialData.groupPhotoUrl
            if (groupPhoto) {
                groupUrl = await uploadToStorage(groupPhoto) || groupUrl
            }

            const addedHighlightUrls: string[] = []
            if (newHighlights) {
                for (let i = 0; i < newHighlights.length; i++) {
                    const url = await uploadToStorage(newHighlights[i])
                    if (url) addedHighlightUrls.push(url)
                }
            }

            const allHighlights = [...existingHighlights, ...addedHighlightUrls]

            await updateTeamInfo({
                foundationDate,
                groupPhotoUrl: groupUrl,
                highlightPhotos: JSON.stringify(allHighlights),
                captainId: captainId || null,
                leaderId: leaderMode === 'PLAYER' ? (leaderId || null) : null,
                leaderName: leaderMode === 'NON_PLAYER' ? (leaderName || null) : null,
            })

            setGroupPhoto(null)
            setNewHighlights(null)
            alert("保存成功")
        } catch (e) {
            console.error(e)
            alert("保存失败")
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveHighlight = async (indexToRemove: number) => {
        if (!confirm('确定删除该照片?')) return
        const newArr = existingHighlights.filter((_: any, i: number) => i !== indexToRemove)
        await updateTeamInfo({
            highlightPhotos: JSON.stringify(newArr)
        })
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">球队概况</h1>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-5 h-5" /> {loading ? '保存中...' : '保存更改'}
                </button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-8">
                {/* 基本与人员信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">建队时间</label>
                        <input
                            type="date"
                            value={foundationDate}
                            onChange={e => setFoundationDate(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">球队队长 (从队员中选择)</label>
                        <select
                            value={captainId}
                            onChange={e => setCaptainId(e.target.value)}
                            className="w-full rounded-md border border-slate-300 px-3 py-2 focus:outline-emerald-500 bg-white"
                        >
                            <option value="">-- 请选择队长 --</option>
                            {players.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="md:col-span-2 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                        <label className="block text-sm font-medium text-slate-700 mb-3">领队设置</label>
                        <div className="flex items-center gap-6 mb-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="leaderMode"
                                    checked={leaderMode === 'PLAYER'}
                                    onChange={() => setLeaderMode('PLAYER')}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm">选拔现有队员</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="leaderMode"
                                    checked={leaderMode === 'NON_PLAYER'}
                                    onChange={() => setLeaderMode('NON_PLAYER')}
                                    className="text-emerald-600 focus:ring-emerald-500"
                                />
                                <span className="text-sm">外聘/非队员录入</span>
                            </label>
                        </div>

                        {leaderMode === 'PLAYER' ? (
                            <select
                                value={leaderId}
                                onChange={e => setLeaderId(e.target.value)}
                                className="w-full md:w-1/2 rounded-md border border-slate-300 px-3 py-2 focus:outline-emerald-500 bg-white"
                            >
                                <option value="">-- 请选择领队队员 --</option>
                                {players.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                placeholder="请输入外聘领队姓名"
                                value={leaderName}
                                onChange={e => setLeaderName(e.target.value)}
                                className="w-full md:w-1/2 rounded-md border border-slate-300 px-3 py-2 focus:outline-emerald-500"
                            />
                        )}
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">球队主页/合影</label>
                    {initialData.groupPhotoUrl && !groupPhoto && (
                        <img src={initialData.groupPhotoUrl} alt="Team Group" className="w-full h-64 object-cover rounded-lg mb-4" />
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={e => setGroupPhoto(e.target.files?.[0] || null)}
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700"
                    />
                </div>

                <div className="pt-6 border-t border-slate-100">
                    <label className="block text-sm font-medium text-slate-700 mb-2">精彩瞬间图集</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {existingHighlights.map((url: string, idx: number) => (
                            <div key={idx} className="relative group">
                                <img src={url} className="w-full h-32 object-cover rounded-lg" />
                                <button
                                    onClick={() => handleRemoveHighlight(idx)}
                                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={e => setNewHighlights(e.target.files)}
                        className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-emerald-50 file:text-emerald-700"
                    />
                </div>
            </div>
        </div>
    )
}
