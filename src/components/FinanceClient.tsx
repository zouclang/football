"use client"

import { useState } from 'react'
import { DollarSign, Wallet, Edit2, Trash2, X } from 'lucide-react'
import {
    addTeamFundTransaction, addPersonalTransactions, addDiningExpense,
    updateTeamFundTransaction, deleteTeamFundTransaction,
    updatePersonalTransaction, deletePersonalTransaction,
    updateDiningRecord, deleteDiningRecord
} from '@/lib/actions/finance'
import { saveMemberFundTransaction, deleteMemberFundTransaction } from '@/lib/actions/memberFund'
import { format } from 'date-fns'
import { Pagination } from './Pagination'
import type { TeamFundTransaction, PersonalTransaction, User, DiningRecord, MemberFundTransaction } from '@prisma/client'

type PersonalTransactionWithUser = PersonalTransaction & { user: User }

type FinanceClientProps = {
    teamTransactions: TeamFundTransaction[]
    personalTransactions: PersonalTransactionWithUser[]
    players: User[]
    teamBalance: number
    leaderName: string | null
    incomeCategories: string[]
    expenseCategories: string[]
    diningRecords: DiningRecord[]
    memberFundTransactions: (MemberFundTransaction & { payers: User[] })[]
    memberFundBalance: number
}

export function FinanceClient({
    teamTransactions,
    personalTransactions,
    players,
    teamBalance,
    leaderName,
    incomeCategories,
    expenseCategories,
    diningRecords,
    memberFundTransactions,
    memberFundBalance
}: FinanceClientProps) {
    const [activeTab, setActiveTab] = useState<'TEAM' | 'PERSONAL' | 'DINING' | 'MEMBER'>('TEAM')

    const [currentMemberPage, setCurrentMemberPage] = useState(1)
    const [memberPageSize, setMemberPageSize] = useState(15)

    // 计算可以选择的经办人员：队员列表 + 领队名字(如果是非队员)
    const handlerOptions = players.map(p => p.name)
    if (leaderName && !handlerOptions.includes(leaderName)) {
        handlerOptions.push(leaderName)
    }

    // 计算当前所有会员的最新缴费记录
    const membersList = players.filter(p => p.isMember).map((p, index) => {
        const latestTx = memberFundTransactions
            .filter(tx => tx.type === 'INCOME' && tx.payers?.some(payer => payer.id === p.id))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

        return {
            ...p,
            index: index + 1,
            lastPaymentDate: latestTx ? new Date(latestTx.date) : null,
            lastPaymentAmount: latestTx?.perPersonAmount || 0
        }
    })

    const paginatedMembersList = membersList.slice((currentMemberPage - 1) * memberPageSize, currentMemberPage * memberPageSize)

    // 计算本年度各项支出汇总
    const currentYear = new Date().getFullYear()
    const currentYearExpenses = teamTransactions.filter(tx =>
        tx.transactionType === 'EXPENSE' &&
        new Date(tx.date).getFullYear() === currentYear
    )

    const expenseSummary = currentYearExpenses.reduce((acc, tx) => {
        acc[tx.category] = (acc[tx.category] || 0) + Math.abs(tx.amount)
        return acc
    }, {} as Record<string, number>)

    const totalExpense = Object.values(expenseSummary).reduce((sum, amount) => sum + amount, 0)

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">财务管理</h1>
                    {activeTab === 'MEMBER' ? (
                        <p className="text-slate-500 mt-1">当前会员费余额: <strong className="text-purple-600 text-lg">¥{memberFundBalance.toFixed(2)}</strong></p>
                    ) : (
                        <p className="text-slate-500 mt-1">当前赞助费结余: <strong className="text-emerald-600 text-lg">¥{teamBalance.toFixed(2)}</strong></p>
                    )}
                </div>

                <div className="flex bg-slate-200 p-1 rounded-xl w-fit">
                    <button onClick={() => setActiveTab('TEAM')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'TEAM' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
                        赞助费账单
                    </button>
                    <button onClick={() => setActiveTab('PERSONAL')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'PERSONAL' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'}`}>
                        个人账户流水
                    </button>
                    <button onClick={() => setActiveTab('DINING')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'DINING' ? 'bg-white shadow text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>
                        + 聚餐分摊
                    </button>
                    <button onClick={() => setActiveTab('MEMBER')} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'MEMBER' ? 'bg-white shadow text-purple-600' : 'text-slate-600 hover:text-purple-600'}`}>
                        👑 会员费账单
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {activeTab === 'TEAM' && <TeamFundTab transactions={teamTransactions} handlerOptions={handlerOptions} incomeCategories={incomeCategories} expenseCategories={expenseCategories} />}
                    {activeTab === 'PERSONAL' && <PersonalFundTab transactions={personalTransactions} players={players} />}
                    {activeTab === 'DINING' && <DiningShareTab players={players} handlerOptions={handlerOptions} diningRecords={diningRecords} />}
                    {activeTab === 'MEMBER' && <MemberFundTab transactions={memberFundTransactions} players={players} balance={memberFundBalance} />}
                </div>

                <div className="space-y-6">
                    {activeTab === 'MEMBER' && (
                        <div className="bg-white p-6 rounded-xl border border-purple-200 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-900">
                                👑 当前会员列表
                            </h2>
                            <div className="max-h-[500px] overflow-y-auto pr-2">
                                <table className="w-full text-sm text-left text-slate-600">
                                    <thead className="text-xs text-slate-500 bg-slate-50 uppercase sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 rounded-l-lg">序号</th>
                                            <th className="px-3 py-2">队员</th>
                                            <th className="px-3 py-2">缴费时间</th>
                                            <th className="px-3 py-2 rounded-r-lg text-right">缴费金额</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {membersList.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="text-center py-4 text-slate-400">暂无会员</td>
                                            </tr>
                                        )}
                                        {paginatedMembersList.map((m) => (
                                            <tr key={m.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                                                <td className="px-3 py-2 font-medium text-slate-400">{m.index}</td>
                                                <td className="px-3 py-2 font-bold text-slate-800">{m.name}</td>
                                                <td className="px-3 py-2 text-slate-500">
                                                    {m.lastPaymentDate ? format(m.lastPaymentDate, 'yyyy-MM-dd') : '-'}
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium text-purple-600">
                                                    {m.lastPaymentAmount > 0 ? `¥${m.lastPaymentAmount.toFixed(2)}` : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-2">
                                <Pagination
                                    currentPage={currentMemberPage}
                                    pageSize={memberPageSize}
                                    totalItems={membersList.length}
                                    onPageChange={setCurrentMemberPage}
                                    onPageSizeChange={(size) => {
                                        setMemberPageSize(size)
                                        setCurrentMemberPage(1)
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'TEAM' && (
                        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-rose-500" />
                                {currentYear}年度支出汇总
                            </h2>
                            <div className="space-y-3 pr-2">
                                {Object.entries(expenseSummary).map(([category, amount]) => (
                                    <div key={category} className="flex justify-between items-center p-3 rounded-lg border border-slate-100 bg-slate-50">
                                        <div className="font-medium text-slate-700">{category}</div>
                                        <div className="font-bold text-rose-600">
                                            ¥{amount.toFixed(2)}
                                        </div>
                                    </div>
                                ))}
                                {Object.keys(expenseSummary).length === 0 && (
                                    <div className="text-center py-4 text-slate-400 text-sm">暂无支出记录</div>
                                )}
                                {Object.keys(expenseSummary).length > 0 && (
                                    <div className="flex justify-between items-center p-3 rounded-lg bg-rose-50 border border-rose-100 mt-2">
                                        <div className="font-bold text-rose-800">总计</div>
                                        <div className="font-bold text-rose-700 text-lg">
                                            ¥{totalExpense.toFixed(2)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {(activeTab === 'PERSONAL' || activeTab === 'DINING') && (
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
                    )}
                </div>
            </div>
        </div>
    )
}

function TeamFundTab({ transactions, handlerOptions, incomeCategories, expenseCategories }: {
    transactions: TeamFundTransaction[],
    handlerOptions: string[],
    incomeCategories: string[],
    expenseCategories: string[]
}) {
    const [loading, setLoading] = useState(false)
    const [filterMonth, setFilterMonth] = useState('')
    const [txType, setTxType] = useState<"INCOME" | "EXPENSE">("EXPENSE")

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const [editingTx, setEditingTx] = useState<TeamFundTransaction | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (confirm("确定要删除这条账单记录并将计算连带回退吗？")) {
            setDeletingId(id)
            try {
                await deleteTeamFundTransaction(id)
            } catch (e) {
                alert("删除失败")
            } finally {
                setDeletingId(null)
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await addTeamFundTransaction({
                date: formData.get('date') as string,
                amount: Number(formData.get('amount')),
                transactionType: txType,
                category: formData.get('category') as string,
                handlerName: formData.get('handlerName') as string,
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
        ? transactions.filter(t => format(new Date(t.date), 'yyyy-MM') === filterMonth)
        : transactions

    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const dynamicCategories = txType === 'INCOME' ? incomeCategories : expenseCategories

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
                <h3 className="font-semibold text-lg mb-4">记录普通收支</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">日期 *</label>
                            <input name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">金额 *</label>
                            <input name="amount" type="number" step="0.01" required placeholder="0.00" className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">收支类型</label>
                            <select value={txType} onChange={e => setTxType(e.target.value as "INCOME" | "EXPENSE")} className="w-full border border-slate-300 rounded-md p-2 bg-white focus:ring-emerald-500">
                                <option value="INCOME">收入</option>
                                <option value="EXPENSE">支出</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">类目名称 *</label>
                            <input name="category" list="category-options" required placeholder="可手填或下拉选择" className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" />
                            <datalist id="category-options">
                                {dynamicCategories.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">经办人选 (可选)</label>
                            <select name="handlerName" className="w-full border border-slate-300 rounded-md p-2 bg-white focus:ring-emerald-500">
                                <option value="">-- 请选择 --</option>
                                {handlerOptions.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">备注说明</label>
                            <input name="description" className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" placeholder="(选填)" />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
                            {loading ? '提交中...' : '添加账单记录'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="flex items-center gap-3">
                <label className="text-sm text-slate-500 shrink-0">记账月份:</label>
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
                            <th className="px-4 py-3">发生日期</th>
                            <th className="px-4 py-3">类目 / 说明</th>
                            <th className="px-4 py-3">经办人</th>
                            <th className="px-4 py-3 text-right">金额</th>
                            <th className="px-4 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginated.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500">{format(new Date(t.date), 'yyyy-MM-dd')}</td>
                                <td className="px-4 py-3">
                                    <span className="font-medium text-slate-800">{t.category}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-500">{t.handlerName || '-'}</td>
                                <td className={`px-4 py-3 text-right font-bold ${t.transactionType === 'INCOME' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                    {t.transactionType === 'INCOME' ? '+' : '-'} ¥{t.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => setEditingTx(t)} className="text-blue-600 hover:text-blue-800 p-1">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        disabled={deletingId === t.id}
                                        className="text-red-600 hover:text-red-800 p-1 ml-1 disabled:opacity-40"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">暂无记录</td></tr>}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={filtered.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size)
                        setCurrentPage(1)
                    }}
                />
            </div>

            {editingTx && (
                <TeamFundEditModal
                    tx={editingTx}
                    handlerOptions={handlerOptions}
                    incomeCategories={incomeCategories}
                    expenseCategories={expenseCategories}
                    onClose={() => setEditingTx(null)}
                />
            )}
        </div>
    )
}

function PersonalFundTab({ transactions, players }: { transactions: PersonalTransactionWithUser[], players: User[] }) {
    const [loading, setLoading] = useState(false)
    const [filterUserId, setFilterUserId] = useState('')

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const [editingTx, setEditingTx] = useState<PersonalTransactionWithUser | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (confirm("确定要删除这条个人流水并且重算余额吗？")) {
            setDeletingId(id)
            try {
                await deletePersonalTransaction(id)
            } catch (e) {
                alert("删除失败")
            } finally {
                setDeletingId(null)
            }
        }
    }

    // 多选队员逻辑
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

    const toggleUser = (id: string) => {
        const next = new Set(selectedUserIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedUserIds(next)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (selectedUserIds.size === 0) return alert("请在下方至少勾选一名退/充值队员")
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const amountVal = Number(formData.get('amount'))
        try {
            await addPersonalTransactions({
                userIds: Array.from(selectedUserIds),
                amount: amountVal, // Negative if expense
                category: amountVal >= 0 ? '账户充值' : '账户扣款',
                description: formData.get('description') as string,
                date: formData.get('date') as string,
            })
            alert(`已成功批量处理 ${selectedUserIds.size} 人的账户请求。`)
            setSelectedUserIds(new Set())
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

    const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
                <h3 className="font-semibold text-lg mb-4">录入个人账户充值或退款 (支持多选)</h3>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">发生日期 *</label>
                            <input name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full border border-slate-300 rounded-md p-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">单人变化金额 * (退费请写负数)</label>
                            <input name="amount" type="number" step="0.01" required placeholder="例如: 100 或 -50" className="w-full border border-slate-300 rounded-md p-2 focus:ring-indigo-500" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">备注说明</label>
                            <input name="description" className="w-full border border-slate-300 rounded-md p-2 focus:ring-indigo-500" placeholder="(选填)" />
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <h4 className="font-medium text-slate-800 mb-3 flex justify-between items-center text-sm">
                            <span>点击勾选操作对象 (已选: <strong className="text-indigo-600">{selectedUserIds.size}</strong> 人)</span>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setSelectedUserIds(new Set(players.map(p => p.id)))} className="text-indigo-600 text-xs hover:underline">全选</button>
                                <button type="button" onClick={() => setSelectedUserIds(new Set())} className="text-slate-400 text-xs hover:underline">清空</button>
                            </div>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto pr-2">
                            {players.map(p => {
                                const isActive = selectedUserIds.has(p.id)
                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => toggleUser(p.id)}
                                        className={`cursor-pointer border rounded-lg p-2 text-center text-sm transition-colors ${isActive ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-700 hover:border-indigo-300'
                                            }`}
                                    >
                                        {p.name}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
                            {loading ? '提交批量操作...' : `为选中的 ${selectedUserIds.size} 人执行提交`}
                        </button>
                    </div>
                </form>
            </div>

            <div className="flex items-center gap-3">
                <label className="text-sm text-slate-500 shrink-0">筛选球员流水:</label>
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
                            <th className="px-4 py-3">发生日期</th>
                            <th className="px-4 py-3">球员</th>
                            <th className="px-4 py-3">类目 / 说明</th>
                            <th className="px-4 py-3 text-right">变动金额</th>
                            <th className="px-4 py-3 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginated.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-500">{format(new Date(t.date), 'yyyy-MM-dd')}</td>
                                <td className="px-4 py-3 font-medium text-slate-900">{t.user.name}</td>
                                <td className="px-4 py-3">
                                    <span className="font-medium text-slate-800">{t.category}</span>
                                </td>
                                <td className={`px-4 py-3 text-right font-bold ${t.amount > 0 ? 'text-indigo-600' : 'text-slate-800'}`}>
                                    {t.amount > 0 ? '+' : ''}{t.amount.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => setEditingTx(t)} className="text-blue-600 hover:text-blue-800 p-1">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(t.id)}
                                        disabled={deletingId === t.id}
                                        className="text-red-600 hover:text-red-800 p-1 ml-1 disabled:opacity-40"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-slate-400">暂无记录</td></tr>}
                    </tbody>
                </table>
            </div>
            <Pagination
                currentPage={currentPage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setCurrentPage}
                onPageSizeChange={(size) => {
                    setPageSize(size)
                    setCurrentPage(1)
                }}
            />

            {editingTx && (
                <PersonalFundEditModal
                    tx={editingTx}
                    onClose={() => setEditingTx(null)}
                />
            )}
        </div>
    )
}
function DiningShareTab({ players, handlerOptions, diningRecords }: { players: User[], handlerOptions: string[], diningRecords: DiningRecord[] }) {
    const [loading, setLoading] = useState(false)
    const [amount, setAmount] = useState<number | ''>('')
    const [maxLimit, setMaxLimit] = useState<number | ''>(100)
    const [date, setDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
    const [handlerName, setHandlerName] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString())
    const [showAllDiningPlayers, setShowAllDiningPlayers] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const [editingRecord, setEditingRecord] = useState<DiningRecord | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        if (confirm("🔴 警告：作废此聚餐记录将级联撤销这笔账关联的所有人员被扣余额（自动加回充值），以及撤回赞助费内如果发生过的兜底补贴！\n\n一旦不可逆转，您确定要删除此笔聚餐账目吗？")) {
            setDeletingId(id)
            try {
                await deleteDiningRecord(id)
            } catch (e) {
                alert("删除失败，或可能是旧数据无对应依赖")
            } finally {
                setDeletingId(null)
            }
        }
    }

    const availableYears = Array.from(new Set(diningRecords.map(r => new Date(r.date).getFullYear().toString())))
    if (!availableYears.includes(new Date().getFullYear().toString())) {
        availableYears.push(new Date().getFullYear().toString())
    }
    availableYears.sort((a, b) => Number(b) - Number(a))

    const filteredRecords = diningRecords.filter(r => new Date(r.date).getFullYear().toString() === filterYear)

    const paginatedRecords = filteredRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    const toggle = (id: string) => {
        const next = new Set(selected)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelected(next)
    }

    const numPeople = selected.size
    const total = Number(amount) || 0
    const limit = Number(maxLimit) || 100
    const rawShare = numPeople > 0 ? total / numPeople : 0
    const actualDeduction = Math.min(limit, rawShare)
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
                date: formData.get('date') as string,
                handlerName: handlerName || undefined,
                maxPerPerson: Number(maxLimit) || 100
            })
            alert("聚餐分摊结算完成！已成功扣减参会人员账户并在可能超额时扣减了赞助费。")
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
                    <h3 className="font-bold text-lg text-emerald-900">聚餐分摊结算</h3>
                    <p className="text-sm text-emerald-700">规则: 请设置人均扣发的封顶金额，超出部分结算时将由赞助费自动进行补贴。</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">聚餐时间 *</label>
                        <input
                            name="date"
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full border border-emerald-200 focus:border-emerald-500 rounded-lg p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">本次总消费金额 *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={e => setAmount(Number(e.target.value) || '')}
                            required
                            className="w-full border border-emerald-200 focus:border-emerald-500 rounded-lg p-3 font-bold"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">人均扣发上限 *</label>
                        <input
                            type="number"
                            step="0.01"
                            value={maxLimit}
                            onChange={e => setMaxLimit(Number(e.target.value) || '')}
                            required
                            className="w-full border border-emerald-200 focus:border-emerald-500 rounded-lg p-3 font-bold text-emerald-700"
                            placeholder="默认: 100"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">垫付经办人 (可选)</label>
                        <select
                            value={handlerName}
                            onChange={e => setHandlerName(e.target.value)}
                            className="w-full border border-emerald-200 focus:border-emerald-500 rounded-lg p-3 bg-white"
                        >
                            <option value="">-- 请选择 --</option>
                            {handlerOptions.map(name => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">账单明细/地点 (选填)</label>
                        <input
                            name="description"
                            className="w-full border border-emerald-200 focus:border-emerald-500 rounded-lg p-3"
                            placeholder="例如: 某某大酒店"
                        />
                    </div>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-medium text-slate-800 mb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <span>点击勾选聚餐参会球员 ({numPeople} 人)</span>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer text-sm font-normal text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={showAllDiningPlayers}
                                    onChange={(e) => setShowAllDiningPlayers(e.target.checked)}
                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                显示所有球员 (含隐退)
                            </label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setSelected(new Set(players.filter(p => showAllDiningPlayers || p.isActive !== false).map(p => p.id)))} className="text-emerald-600 text-sm hover:underline">全新展现全选</button>
                                <button type="button" onClick={() => setSelected(new Set())} className="text-slate-400 text-sm hover:underline">清空</button>
                            </div>
                        </div>
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-2">
                        {(showAllDiningPlayers ? players : players.filter(p => p.isActive !== false)).map(p => {
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
                                每人将被扣除: <strong className="text-xl">¥{actualDeduction.toFixed(2)}</strong> <span className="text-sm opacity-80">(原均摊: ¥{rawShare.toFixed(2)})</span>
                            </p>
                            {remainder > 0.01 && (
                                <p className="text-orange-600 font-medium">
                                    提示：由于人均超标，此单在结算时将自动从 <strong className="underline">赞助费</strong> 中额外支出补贴差额 ¥{remainder.toFixed(2)}
                                </p>
                            )}
                        </div>
                        <button type="submit" disabled={loading} className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-200 disabled:opacity-50">
                            {loading ? '分摊结算处理中...' : '确认执行分摊与扣款'}
                        </button>
                    </div>
                )}
            </form>

            <div className="mt-8 pt-6 border-t border-slate-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-slate-800">历次聚餐列表</h3>
                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(e.target.value)}
                        className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
                    >
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year} 年</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm text-slate-600">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="px-4 py-3">聚餐时间</th>
                                <th className="px-4 py-3">饭店 / 说明</th>
                                <th className="px-4 py-3 text-right">总金额</th>
                                <th className="px-4 py-3 text-center">人数</th>
                                <th className="px-4 py-3 text-right">人均</th>
                                <th className="px-4 py-3 text-right">球队补贴</th>
                                <th className="px-4 py-3">经办人</th>
                                <th className="px-4 py-3 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedRecords.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{format(new Date(r.date), 'yyyy-MM-dd')}</td>
                                    <td className="px-4 py-3 font-medium text-slate-900">{r.restaurantName || '-'}</td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-600">¥{r.totalAmount.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-center text-slate-500">{r.participantCount}</td>
                                    <td className="px-4 py-3 text-right font-medium text-slate-700">¥{r.perPersonAmount.toFixed(2)}</td>
                                    <td className="px-4 py-3 text-right text-orange-600 font-medium">
                                        {r.subsidyAmount > 0 ? `¥${r.subsidyAmount.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">{r.handlerName || '-'}</td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => setEditingRecord(r)} className="text-blue-600 hover:text-blue-800 p-1">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            disabled={deletingId === r.id}
                                            className="text-red-600 hover:text-red-800 p-1 ml-1 disabled:opacity-40"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center py-6 text-slate-400">该年份暂无聚餐记录</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    <Pagination
                        currentPage={currentPage}
                        pageSize={pageSize}
                        totalItems={filteredRecords.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={(size) => {
                            setPageSize(size)
                            setCurrentPage(1)
                        }}
                    />
                </div>
            </div>

            {editingRecord && (
                <DiningRecordEditModal
                    record={editingRecord}
                    handlerOptions={handlerOptions}
                    onClose={() => setEditingRecord(null)}
                />
            )}
        </div>
    )
}

function DiningRecordEditModal({ record, handlerOptions, onClose }: { record: DiningRecord, handlerOptions: string[], onClose: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await updateDiningRecord(record.id, {
                date: formData.get('date') as string,
                handlerName: formData.get('handlerName') as string,
                restaurantName: formData.get('restaurantName') as string,
            })
            onClose()
        } catch (error) {
            alert("保存修改失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">修改聚餐信息</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <div className="bg-orange-50 p-3 text-sm text-orange-800 border-b border-orange-100">
                    提示：为保障账目重算安全安全，**总金额**与**人数**在产生后不可更改。<br />若关键数据有变，请直接废弃这条聚餐记录并在外侧重新结算。
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">聚餐日期 *</label>
                            <input name="date" type="date" required defaultValue={format(new Date(record.date), 'yyyy-MM-dd')} className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">垫付经办人 (可选)</label>
                            <select name="handlerName" defaultValue={record.handlerName || ''} className="w-full border border-slate-300 rounded-md p-2 bg-white focus:ring-emerald-500">
                                <option value="">-- 请选择 --</option>
                                {handlerOptions.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">饭店 / 说明</label>
                            <input name="restaurantName" defaultValue={record.restaurantName || ''} className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" placeholder="(选填)" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">取消</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50">
                            {loading ? '保存中...' : '确认修改'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function TeamFundEditModal({ tx, handlerOptions, incomeCategories, expenseCategories, onClose }: { tx: TeamFundTransaction, handlerOptions: string[], incomeCategories: string[], expenseCategories: string[], onClose: () => void }) {
    const [loading, setLoading] = useState(false)
    const [txType, setTxType] = useState<"INCOME" | "EXPENSE">(tx.transactionType as "INCOME" | "EXPENSE")

    const dynamicCategories = txType === 'INCOME' ? incomeCategories : expenseCategories

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await updateTeamFundTransaction(tx.id, {
                date: formData.get('date') as string,
                amount: Number(formData.get('amount')),
                transactionType: txType,
                category: formData.get('category') as string,
                handlerName: formData.get('handlerName') as string,
                description: formData.get('description') as string,
            })
            onClose()
        } catch (error) {
            alert("保存修改失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">修改赞助费记录</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">日期 *</label>
                            <input name="date" type="date" required defaultValue={format(new Date(tx.date), 'yyyy-MM-dd')} className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">金额 *</label>
                            <input name="amount" type="number" step="0.01" required defaultValue={tx.amount} className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">收支类型</label>
                            <select value={txType} onChange={e => setTxType(e.target.value as "INCOME" | "EXPENSE")} className="w-full border border-slate-300 rounded-md p-2 bg-white focus:ring-emerald-500">
                                <option value="INCOME">收入</option>
                                <option value="EXPENSE">支出</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">类目名称 *</label>
                            <input name="category" list="edit-category-options" required defaultValue={tx.category} className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" />
                            <datalist id="edit-category-options">
                                {dynamicCategories.map(cat => (
                                    <option key={cat} value={cat} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">经办人选 (可选)</label>
                            <select name="handlerName" defaultValue={tx.handlerName || ''} className="w-full border border-slate-300 rounded-md p-2 bg-white focus:ring-emerald-500">
                                <option value="">-- 请选择 --</option>
                                {handlerOptions.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">备注说明</label>
                            <input name="description" defaultValue={tx.description || ''} className="w-full border border-slate-300 rounded-md p-2 focus:ring-emerald-500" placeholder="(选填)" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">取消</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                            {loading ? '保存中...' : '确认修改'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function PersonalFundEditModal({ tx, onClose }: { tx: PersonalTransactionWithUser, onClose: () => void }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        try {
            await updatePersonalTransaction(tx.id, {
                amount: Number(formData.get('amount')),
                category: tx.category,
                description: formData.get('description') as string,
                date: formData.get('date') as string,
            })
            onClose()
        } catch (error) {
            alert("保存修改失败")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">修改个人流水记录 - {tx.user.name}</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">发生日期 *</label>
                            <input name="date" type="date" required defaultValue={format(new Date(tx.date), 'yyyy-MM-dd')} className="w-full border border-slate-300 rounded-md p-2 focus:ring-indigo-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">变动金额 * (退费请写负数)</label>
                            <input name="amount" type="number" step="0.01" required defaultValue={tx.amount} className="w-full border border-slate-300 rounded-md p-2 focus:ring-indigo-500" />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-slate-700 mb-1">备注说明</label>
                            <input name="description" defaultValue={tx.description || ''} className="w-full border border-slate-300 rounded-md p-2 focus:ring-indigo-500" placeholder="(选填)" />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">取消</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50">
                            {loading ? '保存中...' : '确认修改并重算余额'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function MemberFundTab({ transactions, players, balance }: {
    transactions: (MemberFundTransaction & { payers: User[] })[]
    players: User[]
    balance: number
}) {
    const [loading, setLoading] = useState(false)
    const [showInactive, setShowInactive] = useState(false)
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set())
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(20)

    const handleDelete = async (id: string) => {
        if (confirm("确定要删除这条账单记录并将计算连带回退吗？\n注意：如果您误操作删除了收款单，原先赋予的会员标识需您手动在球员管理中去摘除。")) {
            setDeletingId(id)
            try {
                await deleteMemberFundTransaction(id)
            } catch (e) {
                alert("删除失败")
            } finally {
                setDeletingId(null)
            }
        }
    }

    const togglePlayer = (id: string) => {
        const next = new Set(selectedPlayerIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setSelectedPlayerIds(next)
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const perPerson = Number(formData.get('perPersonAmount'))
        const amount = perPerson * selectedPlayerIds.size

        if (selectedPlayerIds.size === 0) {
            alert("必须至少选择一名缴费的球员！")
            setLoading(false)
            return
        }

        try {
            await saveMemberFundTransaction({
                date: formData.get('date') as string,
                totalAmount: amount,
                perPersonAmount: perPerson,
                type: "INCOME",
                description: formData.get('description') as string,
                payerIds: Array.from(selectedPlayerIds)
            })
                ; (e.target as HTMLFormElement).reset()
            setSelectedPlayerIds(new Set())
        } catch (e) {
            alert("提交失败")
        } finally {
            setLoading(false)
        }
    }

    const displayPlayers = players.filter(p => showInactive || p.isActive)

    const paginatedTransactions = transactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)

    return (
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                        <span>会费收取</span>
                        <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">自动算总账并下发会员身份</span>
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-600">包含隐退球员</span>
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                            className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">日期 *</label>
                            <input name="date" type="date" required defaultValue={format(new Date(), 'yyyy-MM-dd')} className="w-full border border-slate-300 rounded-md p-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">单人人均缴费 (¥) *</label>
                            <input name="perPersonAmount" type="number" step="0.01" required placeholder="例如：300" className="w-full border border-slate-300 rounded-md p-2 focus:ring-purple-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">批次备注 (选填)</label>
                            <input name="description" placeholder="例: 26年春季第一批会费" className="w-full border border-slate-300 rounded-md p-2 focus:ring-purple-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-2">在这批打款中选择充值的成员 ({selectedPlayerIds.size} 人):</label>
                        <div className="flex gap-2 flex-wrap max-h-[160px] overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                            {displayPlayers.map(p => {
                                const isSelected = selectedPlayerIds.has(p.id)
                                return (
                                    <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => togglePlayer(p.id)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${isSelected
                                            ? 'bg-purple-100 border-purple-300 text-purple-800 shadow-sm'
                                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                                            }`}
                                    >
                                        {p.name}
                                    </button>
                                )
                            })}
                            {displayPlayers.length === 0 && <span className="text-sm text-slate-400 p-2">没有可选球员...</span>}
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                        <div className="text-sm text-slate-500">
                            当前批量收缴总核算：<strong className="text-purple-600 text-lg">
                                (提交后自动翻滚总入账)
                            </strong>
                        </div>
                        <button type="submit" disabled={loading || selectedPlayerIds.size === 0} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
                            {loading ? '写库中...' : '提交这一批老铁入会'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden w-full">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">会员资金流水明细池</h3>
                    <div className="font-bold text-slate-700">总池结余: <span className={balance >= 0 ? "text-purple-600" : "text-red-500"}>¥{balance.toFixed(2)}</span></div>
                </div>
                <table className="w-full text-left text-sm text-slate-600 block sm:table overflow-x-auto">
                    <thead className="bg-slate-50/50 text-slate-500 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium">日期</th>
                            <th className="px-6 py-3 font-medium">类型</th>
                            <th className="px-6 py-3 font-medium text-right">总变动额</th>
                            <th className="px-6 py-3 font-medium">涉及人员/事由</th>
                            <th className="px-6 py-3 font-medium text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedTransactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap">{format(new Date(tx.date), 'yyyy-MM-dd')}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tx.type === 'INCOME' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                                        {tx.type === 'INCOME' ? '会费充值' : '热身垫资'}
                                    </span>
                                </td>
                                <td className={`px-6 py-4 text-right font-bold ${tx.type === 'INCOME' ? 'text-purple-600' : 'text-slate-900'}`}>
                                    {tx.type === 'INCOME' ? '+' : '-'}¥{tx.totalAmount.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-800">{tx.description || '-'}</div>
                                    {tx.payers && tx.payers.length > 0 && (
                                        <div className="text-xs text-slate-500 mt-1 space-x-1">
                                            {tx.payers.map(p => <span key={p.id} className="bg-slate-200 px-1 rounded">{p.name}</span>)}
                                            {tx.perPersonAmount && <span>(每人 ¥{tx.perPersonAmount})</span>}
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => handleDelete(tx.id)}
                                        disabled={deletingId === tx.id}
                                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {transactions.length === 0 && (
                            <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">目前没有资金流水。</td></tr>
                        )}
                    </tbody>
                </table>
                <Pagination
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={transactions.length}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
                        setPageSize(size)
                        setCurrentPage(1)
                    }}
                />
            </div>
        </div>
    )
}

