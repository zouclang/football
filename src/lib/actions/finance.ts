"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type TeamFundInput = {
    amount: number
    transactionType: "INCOME" | "EXPENSE"
    category: string
    description?: string
    date?: string       // YYYY-MM-DD
    handlerName?: string // 经办人
}

export type PersonalFundInput = {
    userId: string
    amount: number
    category: string
    description?: string
    date?: string // YYYY-MM-DD
}

export type DiningShareInput = {
    totalAmount: number
    participantIds: string[]
    description?: string
    date?: string // YYYY-MM-DD
    handlerName?: string // 经办人
    maxPerPerson?: number // 自定义人均上限
}

// ============== 辅助：获取历史类目 ==============
export async function getUniqueCategories(type: "INCOME" | "EXPENSE") {
    const transactions = await prisma.teamFundTransaction.findMany({
        where: { transactionType: type },
        select: { category: true },
        distinct: ['category'],
    })
    return transactions.map(t => t.category)
}

// ============== 赞助费操作 ==============
export async function addTeamFundTransaction(data: TeamFundInput) {
    await prisma.teamFundTransaction.create({
        data: {
            amount: data.amount,
            transactionType: data.transactionType,
            category: data.category,
            description: data.description,
            date: data.date ? new Date(data.date) : new Date(),
            handlerName: data.handlerName || null,
        }
    })
    revalidatePath('/finance')
    revalidatePath('/')
}

export async function updateTeamFundTransaction(id: string, data: TeamFundInput) {
    await prisma.teamFundTransaction.update({
        where: { id },
        data: {
            amount: data.amount,
            transactionType: data.transactionType,
            category: data.category,
            description: data.description,
            date: data.date ? new Date(data.date) : new Date(),
            handlerName: data.handlerName || null,
        }
    })
    revalidatePath('/finance')
    revalidatePath('/')
}

export async function deleteTeamFundTransaction(id: string) {
    await prisma.teamFundTransaction.delete({ where: { id } })
    revalidatePath('/finance')
    revalidatePath('/')
}

// ============== 个人账户操作 ==============
// 原本是单个 addPersonalTransaction，现升级为批量 (多选支持)
export async function addPersonalTransactions(data: Omit<PersonalFundInput, 'userId'> & { userIds: string[] }) {
    const { userIds, amount, category, description, date } = data
    const txDate = date ? new Date(date) : new Date()

    // 1. 创建多条流水
    await prisma.personalTransaction.createMany({
        data: userIds.map(userId => ({
            userId,
            amount: amount,
            category: category,
            description: description,
            date: txDate,
        }))
    })

    // 2. 更新每一个用户的余额
    for (const userId of userIds) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                personalBalance: { increment: amount }
            }
        })
    }
    revalidatePath('/finance')
    revalidatePath('/')
}

export async function updatePersonalTransaction(id: string, data: Omit<PersonalFundInput, 'userId'>) {
    const existingTx = await prisma.personalTransaction.findUnique({ where: { id } })
    if (!existingTx) throw new Error("Transaction not found")

    const difference = data.amount - existingTx.amount

    await prisma.$transaction([
        prisma.personalTransaction.update({
            where: { id },
            data: {
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date ? new Date(data.date) : existingTx.date,
            }
        }),
        prisma.user.update({
            where: { id: existingTx.userId },
            data: {
                personalBalance: { increment: difference }
            }
        })
    ])

    revalidatePath('/finance')
    revalidatePath('/')
}

export async function deletePersonalTransaction(id: string) {
    const existingTx = await prisma.personalTransaction.findUnique({ where: { id } })
    if (!existingTx) throw new Error("Transaction not found")

    await prisma.$transaction([
        prisma.personalTransaction.delete({ where: { id } }),
        prisma.user.update({
            where: { id: existingTx.userId },
            data: {
                personalBalance: { decrement: existingTx.amount }
            }
        })
    ])

    revalidatePath('/finance')
    revalidatePath('/')
}

// ============== 聚餐分摊操作 ==============
export async function addDiningExpense(data: DiningShareInput) {
    const { totalAmount, participantIds, description, date } = data
    const numPeople = participantIds.length
    if (numPeople === 0) throw new Error("No participants")

    const limit = data.maxPerPerson ?? 100
    const rawShare = totalAmount / numPeople
    const actualDeduction = Math.min(limit, Math.floor(rawShare * 100) / 100)
    const totalDeducted = actualDeduction * numPeople
    const remainder = totalAmount - totalDeducted
    const txDate = date ? new Date(date) : new Date()

    // 1. Record the overall dining event FIRST to get its ID
    const diningRecord = await prisma.diningRecord.create({
        data: {
            date: txDate,
            totalAmount: totalAmount,
            perPersonAmount: actualDeduction,
            subsidyAmount: remainder > 0.01 ? remainder : 0,
            handlerName: data.handlerName || null,
            restaurantName: description || null,
            participantCount: numPeople
        }
    })

    // 2. Create personal transactions for participants
    await prisma.personalTransaction.createMany({
        data: participantIds.map(id => ({
            userId: id,
            amount: -actualDeduction,
            category: "聚餐分摊",
            description: description || '聚餐分摊 (自动划扣)',
            date: txDate,
            diningRecordId: diningRecord.id
        }))
    })

    // 3. Deduct from users' balances
    for (const uid of participantIds) {
        await prisma.user.update({
            where: { id: uid },
            data: {
                personalBalance: { decrement: actualDeduction }
            }
        })
    }

    // 4. If there is a remainder, deduct from Team Fund
    if (remainder > 0.01) {
        await prisma.teamFundTransaction.create({
            data: {
                amount: remainder,
                transactionType: "EXPENSE",
                category: "球队聚餐补贴",
                description: description ? `${description} - 球队补贴超出部分` : `聚餐分摊 - 球队补贴部分`,
                date: txDate,
                handlerName: data.handlerName || null,
                diningRecordId: diningRecord.id
            }
        })
    }

    revalidatePath('/finance')
    revalidatePath('/')
}

export async function getDiningRecords() {
    const records = await prisma.diningRecord.findMany({
        orderBy: { date: 'desc' }
    })
    return records
}

export async function updateDiningRecord(id: string, data: { date?: string, handlerName?: string | null, restaurantName?: string | null }) {
    await prisma.diningRecord.update({
        where: { id },
        data: {
            date: data.date ? new Date(data.date) : undefined,
            handlerName: data.handlerName,
            restaurantName: data.restaurantName
        }
    })
    revalidatePath('/finance')
    revalidatePath('/')
}

export async function deleteDiningRecord(id: string) {
    const diningRecord = await prisma.diningRecord.findUnique({ where: { id } })
    if (!diningRecord) throw new Error("Dining record not found")

    const personalTxs = await prisma.personalTransaction.findMany({
        where: { diningRecordId: id }
    })

    const operations: any[] = []

    // 1. Revert personal balances (deducted negative amount -> restored)
    for (const tx of personalTxs) {
        operations.push(
            prisma.user.update({
                where: { id: tx.userId },
                data: { personalBalance: { decrement: tx.amount } }
            })
        )
    }

    // 2. Delete associated transactions
    operations.push(prisma.personalTransaction.deleteMany({ where: { diningRecordId: id } }))
    operations.push(prisma.teamFundTransaction.deleteMany({ where: { diningRecordId: id } }))

    // 3. Delete the dining record itself
    operations.push(prisma.diningRecord.delete({ where: { id } }))

    await prisma.$transaction(operations)

    revalidatePath('/finance')
    revalidatePath('/')
}
