"use client"

import { useState } from 'react'
import { DollarSign, Wallet } from 'lucide-react'
import { addTeamFundTransaction, addPersonalTransaction, addDiningExpense, type TeamFundInput, type PersonalFundInput, type DiningShareInput } from '@/lib/actions/finance'
import { format } from 'date-fns'
import type { TeamFundTransaction, PersonalTransaction, User } from '@prisma/client'

// #7: 使用 Prisma 生成的类型，提升类型安全
type PersonalTransactionWithUser = PersonalTransaction & { user: User }

type FinanceClientProps = {
    teamTransactions: TeamFundTransaction[]
    personalTransactions: PersonalTransactionWithUser[]
    players: User[]
    teamBalance: number
}

export function FinanceClient({ teamTransactions, personalTransactions, players, teamBalance }: FinanceClientProps) {
    const [activeTab, setActiveTab] = useState<'TEAM' | 'PERSONAL' | 'DINING'>('TEAM')

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">财务管理</h1>
                    <p className="text-slate-500 mt-1">当前球队基金结余: <strong className="text-emerald-600 text-lg">¥{teamBalance.toFixed(2)}</strong></p>
                </div>

                <div className="flex bg-slate-200 p-1 rounded-xl w-fit">
                    <button onClick={() => setActiveTab('TEAM')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'TEAM' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
                        球队基金账单
                    </button>
                    <button onClick={() => setActiveTab('PERSONAL')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'PERSONAL' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
                        个人账户流水
                    </button>
                    <button onClick={() => setActiveTab('DINING')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'DINING' ? 'bg-white shadow text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>
                        + 聚餐批量分摊
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {activeTab === 'TEAM' && <TeamFundTab transactions={teamTransactions} />}
                    {activeTab === 'PERSONAL' && <PersonalFundTab transactions={personalTransactions} players={players} />}
                    {activeTab === 'DINING' && <DiningShareTab players={players} />}
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-indigo-500" />
                            个人账户概览
                        </h2>
                        <div className="max-h-[500px] overflow-y-auto space-y-3 pr-2">
                            {players.map(p => (
                                <div key={p.id} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50">
                                    <div className="font-medium">{p.name}</div>
                                    <div className={`font-bold ${p.personalBalance < 0 ? 'text-red-500' : 'text-slate-900'}`}>
                                        ¥{p.personalBalance.toFixed(2)}
                                        {p.personalBalance < 0 && <span className="text-xs text-red-500/70 ml-2">(欠费)</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function TeamFundTab({ transactions }: { transactions: TeamFundTransaction[] }) {
    const [loading, setLoading] = useState(false)
    // #13: 月份筛选
    const [filterMonth, setFilterMonth] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await addTeamFundTransaction({
                amount: Number(formData.get('amount')),
                transactionType: formData.get('transactionType') as "INCOME" | "EXPENSE",
                category: formData.get('category') as string,
                description: formData.get('description') as string,
            })
                ; (e.target as HTMLFormElement).reset()
        } catch (e) {
            alert("提交失败")
        } finally {
            setLoading(false)
        }
    }

    const filtered = filterMonth
        ? transactions.filter(t => format(new Date(t.createdAt), 'yyyy-MM') === filterMonth)
        : transactions

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
                <h3 className="font-semibold text-lg mb-4">记录普通收支</h3>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">金额</label>
                        <input name="amount" type="number" step="0.01" required className="w-full border rounded p-2" placeholder="0.00" />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">类型</label>
                        <select name="transactionType" className="w-full border rounded p-2 bg-white">
                            <option value="INCOME">收入 (校友支持/赞助/队费等)</option>
                            <option value="EXPENSE">支出 (场地/包车/球衣/饮料等)</option>
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">类目名称</label>
                        <input name="category" required className="w-full border rounded p-2" placeholder="例如: 场地费" />
                    </div>
                    <div className="flex-[1.5] w-full">
                        <label className="block text-xs text-slate-500 mb-1">备注说明</label>
                        <input name="description" className="w-full border rounded p-2" placeholder="(选填)" />
                    </div>
                    <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shrink-0 disabled:opacity-50">
                        {loading ? '...' : '添加'}
                    </button>
                </form>
            </div>

            {/* #13: 月份筛选控件 */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-slate-500 shrink-0">筛选月份:</label>
                <input
                    type="month"
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                    className="border rounded p-1.5 text-sm text-slate-700"
                />
                {filterMonth && (
                    <button onClick={() => setFilterMonth('')} className="text-xs text-slate-400 hover:text-slate-600 underline">
                        清除筛选
                    </button>
                )}
                <span className="text-xs text-slate-400 ml-auto">共 {filtered.length} 条</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3">时间</th>
                            <th className="px-4 py-3">类目 / 说明</th>
                            <th className="px-4 py-3 text-right">金额</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500">{format(new Date(t.createdAt), 'MM-dd HH:mm')}</td>
                                <td className="px-4 py-3">
                                    <span className="font-medium text-slate-800">{t.category}</span>
                                    {t.description && <span className="text-slate-400 ml-2 text-xs">({t.description})</span>}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${t.transactionType === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                    {t.transactionType === 'INCOME' ? '+' : '-'} ¥{t.amount.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={3} className="text-center py-6 text-slate-400">暂无记录</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function PersonalFundTab({ transactions, players }: { transactions: PersonalTransactionWithUser[], players: User[] }) {
    const [loading, setLoading] = useState(false)
    // #13: 按球员筛选
    const [filterUserId, setFilterUserId] = useState('')

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await addPersonalTransaction({
                userId: formData.get('userId') as string,
                amount: Number(formData.get('amount')), // Negative if expense
                category: formData.get('category') as string,
                description: formData.get('description') as string,
            })
                ; (e.target as HTMLFormElement).reset()
        } catch (e) {
            alert("提交失败")
        } finally {
            setLoading(false)
        }
    }

    const filtered = filterUserId
        ? transactions.filter(t => t.userId === filterUserId)
        : transactions

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
                <h3 className="font-semibold text-lg mb-4">录入个人充值或退款</h3>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">选择球员</label>
                        <select name="userId" required className="w-full border rounded p-2 bg-white">
                            {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">金额 (退款用负数)</label>
                        <input name="amount" type="number" step="0.01" required className="w-full border rounded p-2" placeholder="0.00" />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">类目名称</label>
                        <input name="category" required defaultValue="账户充值" className="w-full border rounded p-2" />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs text-slate-500 mb-1">备注说明</label>
                        <input name="description" className="w-full border rounded p-2" placeholder="(选填)" />
                    </div>
                    <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shrink-0 disabled:opacity-50">
                        {loading ? '...' : '提交'}
                    </button>
                </form>
            </div>

            {/* #13: 按球员筛选 */}
            <div className="flex items-center gap-3">
                <label className="text-sm text-slate-500 shrink-0">筛选球员:</label>
                <select
                    value={filterUserId}
                    onChange={e => setFilterUserId(e.target.value)}
                    className="border rounded p-1.5 text-sm text-slate-700 bg-white"
                >
                    <option value="">全部球员</option>
                    {players.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <span className="text-xs text-slate-400 ml-auto">共 {filtered.length} 条</span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="px-4 py-3">时间</th>
                            <th className="px-4 py-3">球员</th>
                            <th className="px-4 py-3">类目 / 说明</th>
                            <th className="px-4 py-3 text-right">变动金额</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500">{format(new Date(t.createdAt), 'MM-dd HH:mm')}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{t.user.name}</td>
                                <td className="px-4 py-3">
                                    <span className="font-medium text-slate-800">{t.category}</span>
                                    {t.description && <span className="text-slate-400 ml-2 text-xs">({t.description})</span>}
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${t.amount > 0 ? 'text-indigo-600' : 'text-slate-800'}`}>
                                    {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={4} className="text-center py-6 text-slate-400">暂无记录</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function DiningShareTab({ players }: { players: User[] }) {
    const [loading, setLoading] = useState(false)
    const [amount, setAmount] = useState<number | ''>('')
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const toggle = (id: string) => {
        const next = new Set(selected)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelected(next)
    }

    const numPeople = selected.size
    const total = Number(amount) || 0
    const rawShare = numPeople > 0 ? total / numPeople : 0
    const actualDeduction = Math.min(100, rawShare)
    const remainder = total - (actualDeduction * numPeople)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (numPeople === 0) return alert("请先选择参与人员")
        if (total <= 0) return alert("请输入有效总金额")

        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await addDiningExpense({
                totalAmount: total,
                participantIds: Array.from(selected),
                description: formData.get('description') as string,
            })
            alert("聚餐分摊结算完成！")
            setAmount('')
            setSelected(new Set())
                ; (e.target as HTMLFormElement).reset()
        } catch (e) {
            alert("提交失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm w-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                    <DollarSign className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-lg text-emerald-900">聚餐智能分摊账单</h3>
                    <p className="text-sm text-emerald-700">规则: 个人最高扣除 100 元，超出部分由球队基金承担。</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">聚餐总消费金额 *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value) || '')}
                            required
                            className="w-full border border-emerald-200 focus:border-emerald-500 rounded-lg p-3 text-lg"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">账单备注详情</label>
                        <input
                            name="description"
                            className="w-full border border-slate-300 rounded-lg p-3 text-lg"
                            placeholder="例如: 春季联赛赛后聚餐"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-3 flex justify-between items-center">
                        <span>选择参与球员 ({numPeople} 人)</span>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => setSelected(new Set(players.map(p => p.id)))} className="text-emerald-600 text-sm hover:underline">全选</button>
                            {/* #11: 清空选择按钮 */}
                            <button type="button" onClick={() => setSelected(new Set())} className="text-slate-400 text-sm hover:underline">清空</button>
                        </div>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-2">
                        {players.map(p => {
                            const isActive = selected.has(p.id)
                            return (
                                <div
                                    key={p.id}
                                    onClick={() => toggle(p.id)}
                                    className={`cursor-pointer border rounded-lg p-2 text-center text-sm transition-colors ${isActive ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-700 hover:border-emerald-300'
                                        }`}
                                >
                                    {p.name}
                                    <div className={`text-[10px] mt-0.5 ${isActive ? 'text-emerald-200' : 'text-slate-400'}`}>余额 ¥{p.personalBalance.toFixed(0)}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {total > 0 && numPeople > 0 && (
                    <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="space-y-1">
                            <p className="text-emerald-800">
                                每人应扣分摊: <strong className="text-xl">¥{actualDeduction.toFixed(2)}</strong> <span className="text-sm opacity-80">(原均摊: ¥{rawShare.toFixed(2)})</span>
                            </p>
                            {remainder > 0 && (
                                <p className="text-orange-600 font-medium">
                                    超出上限部分，此单将从 <strong className="underline">球队基金</strong> 中额外支出 ¥{remainder.toFixed(2)}
                                </p>
                            )}
                        </div>
                        <button type="submit" disabled={loading} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50">
                            {loading ? '结算中...' : '确认分摊与扣款'}
                        </button>
                    </div>
                )}
            </form>
        </div>
    )
}
