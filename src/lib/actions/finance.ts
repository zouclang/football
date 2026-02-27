"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type TeamFundInput = {
    amount: number
    transactionType: "INCOME" | "EXPENSE"
    category: string
    description?: string
}

export type PersonalFundInput = {
    userId: string
    amount: number
    category: string
    description?: string
}

export type DiningShareInput = {
    totalAmount: number
    participantIds: string[]
    description?: string
}

export async function getTeamFundTransactions() {
    return await prisma.teamFundTransaction.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function getPersonalTransactions(userId?: string) {
    return await prisma.personalTransaction.findMany({
        where: userId ? { userId } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
            user: true
        }
    })
}

/** 
 * Gets the total balance of the team fund 
 */
export async function getTeamFundBalance() {
    const transactions = await prisma.teamFundTransaction.findMany()
    return transactions.reduce((acc, t) => {
        return t.transactionType === 'INCOME' ? acc + t.amount : acc - t.amount
    }, 0)
}

/**
 * Common API: Add standard Team Fund Transaction
 */
export async function addTeamFundTransaction(data: TeamFundInput) {
    await prisma.teamFundTransaction.create({ data })
    try {
        revalidatePath('/finance')
        revalidatePath('/') // #9: 首页展示球队基金余额
    } catch (e) { }
}

/**
 * Common API: Add Personal Account Recharge / Deduction
 */
export async function addPersonalTransaction(data: PersonalFundInput) {
    return await prisma.$transaction(async (tx) => {
        const pt = await tx.personalTransaction.create({
            data: {
                userId: data.userId,
                amount: data.amount,
                category: data.category,
                description: data.description
            }
        })

        await tx.user.update({
            where: { id: data.userId },
            data: {
                personalBalance: {
                    increment: data.amount
                }
            }
        })

        try {
            revalidatePath('/finance')
            revalidatePath('/') // #9: 首页展示个人账户总留存
        } catch (e) { }
        return pt
    })
}

/**
 * Specialized API: Auto Dining Share Rule
 * Splits totalAmount by number of participants, max 100 per person.
 * Remainder is charged to Team Fund.
 */
export async function addDiningExpense(data: DiningShareInput) {
    const { totalAmount, participantIds, description } = data
    const count = participantIds.length

    if (count === 0) throw new Error("Participant count must be greater than 0")

    const rawShare = totalAmount / count
    const personalDeduction = Math.min(100, rawShare)
    const totalPersonalDeduction = personalDeduction * count
    const remainingTeamFundExpense = totalAmount - totalPersonalDeduction

    return await prisma.$transaction(async (tx) => {
        // 1. Deduct from each participant
        for (const userId of participantIds) {
            // Record transaction
            await tx.personalTransaction.create({
                data: {
                    userId,
                    amount: -personalDeduction, // Negative because it's an expense
                    category: "DINING_SHARE",
                    description: description || "聚餐费用分摊 / Dining Share"
                }
            })
            // Update balance
            await tx.user.update({
                where: { id: userId },
                data: {
                    personalBalance: {
                        decrement: personalDeduction
                    }
                }
            })
        }

        // 2. Add Team Fund expense if there's a remainder
        if (remainingTeamFundExpense > 0) {
            await tx.teamFundTransaction.create({
                data: {
                    amount: remainingTeamFundExpense,
                    transactionType: "EXPENSE",
                    category: "DINNER_EXPENSE",
                    description: description ? `${description} (基金承担尾款)` : "聚餐费用尾款 (Team Fund Share)"
                }
            })
        }

        try {
            revalidatePath('/finance')
            revalidatePath('/') // #9: 首页展示余额相关数据
        } catch (e) {
            // Ignore error outside of Next.js context (like test scripts)
        }
    })
}
