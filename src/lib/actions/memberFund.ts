"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type MemberFundInput = {
    date: string
    totalAmount: number
    perPersonAmount?: number | null
    type: "INCOME" | "EXPENSE"
    description?: string | null
    matchId?: string | null
    payerIds?: string[] // 交费的会员 ID 数组
}

export async function getMemberFundTransactions() {
    return prisma.memberFundTransaction.findMany({
        include: { payers: true },
        orderBy: { date: 'desc' }
    })
}

export async function saveMemberFundTransaction(data: MemberFundInput) {
    try {
        const tx = await prisma.memberFundTransaction.create({
            data: {
                date: new Date(data.date),
                totalAmount: data.totalAmount,
                perPersonAmount: data.perPersonAmount,
                type: data.type,
                description: data.description,
                matchId: data.matchId,
                payers: data.payerIds && data.payerIds.length > 0
                    ? { connect: data.payerIds.map(id => ({ id })) }
                    : undefined
            }
        })

        // 【联动业务】：如果是缴纳会费（INCOME）且勾选了相关人员，则同步赋予“会员”标记
        if (data.type === 'INCOME' && data.payerIds && data.payerIds.length > 0) {
            await prisma.user.updateMany({
                where: { id: { in: data.payerIds } },
                data: { isMember: true }
            })
            revalidatePath('/players')
        }

        revalidatePath('/finance')
        return tx
    } catch (e) {
        console.error("Failed to save member fund transaction:", e)
        throw new Error("保存会员费用流转失败")
    }
}

export async function deleteMemberFundTransaction(id: string) {
    try {
        const tx = await prisma.memberFundTransaction.findUnique({
            where: { id },
            include: { payers: true }
        })
        if (!tx) return

        // 执行删除
        await prisma.memberFundTransaction.delete({
            where: { id }
        })

        // 【联动业务撤销】：如果是收款单且删除了，看是否需要剥夺会籍？
        // 这个有点复杂，因为该球员可能交过多次会费，这里先不自动降级会籍，由领队在球员管理手动操作即可。

        revalidatePath('/finance')
    } catch (e) {
        console.error("Failed to delete member fund transaction:", e)
        throw new Error("删除会员流水收支失败")
    }
}
