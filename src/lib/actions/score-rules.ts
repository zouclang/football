"use server"

import prisma from '../prisma'
import { requireAdmin } from '../auth'
import { revalidatePath } from 'next/cache'

export async function getScoreRules() {
    return await prisma.scoreRule.findMany({
        orderBy: { createdAt: 'asc' }
    })
}

export type ScoreRuleInput = {
    id?: string
    key: string
    name: string
    type: string // "PLUS" | "MINUS"
    points: number
    isActive: boolean
}

export async function saveScoreRule(data: ScoreRuleInput) {
    await requireAdmin()
    const { id, key, name, type, points, isActive } = data

    if (id) {
        await prisma.scoreRule.update({
            where: { id },
            data: { key, name, type, points: Math.abs(points), isActive }
        })
    } else {
        await prisma.scoreRule.create({
            data: { key, name, type, points: Math.abs(points), isActive }
        })
    }

    revalidatePath('/settings/score-rules')
    revalidatePath('/players')
}

export async function deleteScoreRule(id: string) {
    await requireAdmin()
    await prisma.scoreRule.delete({ where: { id } })
    revalidatePath('/settings/score-rules')
    revalidatePath('/players')
}

export async function initializeDefaultRules() {
    const count = await prisma.scoreRule.count()
    if (count === 0) {
        const defaults = [
            { key: "LEAGUE_ATTENDANCE", name: "高校联赛出勤", type: "PLUS", points: 2, isActive: true },
            { key: "LEAGUE_GOAL", name: "联赛进球", type: "PLUS", points: 1, isActive: true },
            { key: "LEAGUE_ASSIST", name: "联赛助攻", type: "PLUS", points: 1, isActive: true },
            { key: "WINNING_GK", name: "取胜守门员", type: "PLUS", points: 1, isActive: true },
            { key: "FRIENDLY_ATTENDANCE", name: "热身赛出勤", type: "PLUS", points: 1, isActive: true },
            { key: "DROP_IN", name: "空降", type: "MINUS", points: 1, isActive: true },
            { key: "LATE", name: "迟到", type: "MINUS", points: 1, isActive: true },
            { key: "NO_SHOW", name: "鸽子", type: "MINUS", points: 2, isActive: true },
        ]
        for (const rule of defaults) {
            await prisma.scoreRule.create({ data: rule })
        }
    }
}
