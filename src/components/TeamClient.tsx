"use client"

import { useState } from 'react'
import { Upload, Save } from 'lucide-react'
import { updateTeamInfo, type TeamInfoInput } from '@/lib/actions/team'
import { uploadFile } from '@/lib/actions/upload'

export function TeamClient({ initialData }: { initialData: any }) {
    const [loading, setLoading] = useState(false)
    const [foundationDate, setFoundationDate] = useState(initialData.foundationDate || '')

    const [groupPhoto, setGroupPhoto] = useState<File | null>(null)
    const [newHighlights, setNewHighlights] = useState<FileList | null>(null)

    const existingHighlights = initialData.highlightPhotos ? JSON.parse(initialData.highlightPhotos) : []

    const handleSave = async () => {
        setLoading(true)
        try {
            let groupUrl = initialData.groupPhotoUrl
            if (groupPhoto) {
                const formData = new FormData()
                formData.append('file', groupPhoto)
                groupUrl = await uploadFile(formData) || groupUrl
            }

            const addedHighlightUrls: string[] = []
            if (newHighlights) {
                for (let i = 0; i < newHighlights.length; i++) {
                    const formData = new FormData()
                    formData.append('file', newHighlights[i])
                    const url = await uploadFile(formData)
                    if (url) addedHighlightUrls.push(url)
                }
            }

            const allHighlights = [...existingHighlights, ...addedHighlightUrls]

            await updateTeamInfo({
                foundationDate,
                groupPhotoUrl: groupUrl,
                highlightPhotos: JSON.stringify(allHighlights)
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

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">建队时间</label>
                    <input
                        type="date"
                        value={foundationDate}
                        onChange={e => setFoundationDate(e.target.value)}
                        className="rounded-md border border-slate-300 px-3 py-2 w-64 focus:outline-emerald-500"
                    />
                </div>

                <div className="pt-6 border-t border-slate-100">
                    {/* #4: 修正文字错误，"主卧"→"主页" */}
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
