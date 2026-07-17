"use client"

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { getScoreRules, saveScoreRule, deleteScoreRule, initializeDefaultRules } from '@/lib/actions/score-rules'

export default function ScoreRulesClient() {
    const [rules, setRules] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isOpen, setIsOpen] = useState(false)
    const [editingRule, setEditingRule] = useState<any | null>(null)

    const fetchRules = async () => {
        setLoading(true)
        await initializeDefaultRules()
        const data = await getScoreRules()
        setRules(data)
        setLoading(false)
    }

    useEffect(() => {
        fetchRules()
    }, [])

    const handleOpen = (rule?: any) => {
        setEditingRule(rule || null)
        setIsOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (confirm('确定删除此规则吗？')) {
            await deleteScoreRule(id)
            fetchRules()
        }
    }

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-slate-900">积分规则配置</h1>
                <button
                    onClick={() => handleOpen()}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" /> 添加新规则
                </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-slate-500">加载中...</div>
                ) : (
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 text-slate-700 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-medium">标识键 (Key)</th>
                                <th className="px-6 py-4 font-medium">显示名称</th>
                                <th className="px-6 py-4 font-medium text-center">类型</th>
                                <th className="px-6 py-4 font-medium text-center">分值</th>
                                <th className="px-6 py-4 font-medium text-center">状态</th>
                                <th className="px-6 py-4 font-medium text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rules.map(rule => (
                                <tr key={rule.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{rule.key}</td>
                                    <td className="px-6 py-4 font-medium text-slate-900">{rule.name}</td>
                                    <td className="px-6 py-4 text-center">
                                        {rule.type === 'PLUS' ? (
                                            <span className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded text-xs font-bold">加分</span>
                                        ) : (
                                            <span className="text-rose-700 bg-rose-100 px-2 py-1 rounded text-xs font-bold">扣分</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center font-bold text-slate-800">{rule.points}</td>
                                    <td className="px-6 py-4 text-center">
                                        {rule.isActive ? (
                                            <span className="text-emerald-600">已启用</span>
                                        ) : (
                                            <span className="text-slate-400">已停用</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleOpen(rule)} className="text-blue-600 hover:text-blue-800 p-2 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(rule.id)} className="text-red-600 hover:text-red-800 p-2 ml-2 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {isOpen && (
                <RuleFormModal
                    rule={editingRule}
                    onClose={() => setIsOpen(false)}
                    onSuccess={() => {
                        setIsOpen(false)
                        fetchRules()
                    }}
                />
            )}
        </div>
    )
}

function RuleFormModal({ rule, onClose, onSuccess }: { rule: any | null, onClose: () => void, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        try {
            const formData = new FormData(e.currentTarget)
            await saveScoreRule({
                id: rule?.id,
                key: formData.get('key') as string,
                name: formData.get('name') as string,
                type: formData.get('type') as string,
                points: parseFloat(formData.get('points') as string),
                isActive: formData.get('isActive') === 'true'
            })
            onSuccess()
        } catch (error) {
            console.error(error)
            alert('保存失败，可能是 Key 重复')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
                    <h2 className="text-xl font-bold text-slate-900">{rule ? '编辑规则' : '新增规则'}</h2>
                    <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">标识键 (Key) *</label>
                            <input name="key" defaultValue={rule?.key} required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" placeholder="例如：LEAGUE_ATTENDANCE" />
                            <p className="text-xs text-slate-500 mt-1.5">程序中引用的唯一标识，请勿随意修改系统预设的 Key。</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">显示名称 *</label>
                            <input name="name" defaultValue={rule?.name} required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">类型 *</label>
                                <select name="type" defaultValue={rule?.type || 'PLUS'} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                                    <option value="PLUS">加分 (PLUS)</option>
                                    <option value="MINUS">扣分 (MINUS)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">分值 (绝对值) *</label>
                                <input name="points" type="number" step="0.5" min="0" defaultValue={rule?.points || 1} required className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">状态</label>
                            <select name="isActive" defaultValue={rule?.isActive === false ? 'false' : 'true'} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                                <option value="true">启用</option>
                                <option value="false">停用</option>
                            </select>
                        </div>
                    </div>
                    <div className="p-5 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-5 py-2.5 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700 font-medium transition-colors">取消</button>
                        <button type="submit" disabled={loading} className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50 transition-colors shadow-sm">保存</button>
                    </div>
                </form>
            </div>
        </div>
    )
}
