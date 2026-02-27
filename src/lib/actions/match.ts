"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type MatchInput = {
    id?: string
    date: string
    opponent: string
    type: string // "LEAGUE", "INTERNAL_WARMUP", "EXTERNAL_FRIENDLY"
    ourScore?: number | null
    theirScore?: number | null
    result?: string | null // "WIN", "DRAW", "LOSS"
    attendances?: string[] // User IDs who attended
}

export async function getMatches() {
    return await prisma.match.findMany({
        orderBy: { date: 'desc' },
        include: {
            attendances: true
        }
    })
}

export async function getMatch(id: string) {
    return await prisma.match.findUnique({
        where: { id },
        include: {
            attendances: {
                include: { user: true }
            }
        }
    })
}

export async function saveMatch(data: MatchInput) {
    const { id, date, opponent, type, ourScore, theirScore, result, attendances = [] } = data
    const parsedDate = new Date(date)

    if (id) {
        // Update Match
        await prisma.match.update({
            where: { id },
            data: {
                date: parsedDate,
                opponent,
                type,
                ourScore,
                theirScore,
                result
            }
        })

        // Reconcile attendances: delete old ones not in the new list, insert new ones
        await prisma.attendance.deleteMany({
            where: {
                matchId: id,
                userId: { notIn: attendances }
            }
        })

        const existingAtts = await prisma.attendance.findMany({
            where: { matchId: id }
        })
        const existingUserIds = existingAtts.map(a => a.userId)
        const newAtts = attendances.filter(uid => !existingUserIds.includes(uid))

        if (newAtts.length > 0) {
            await prisma.attendance.createMany({
                data: newAtts.map(uid => ({
                    matchId: id,
                    userId: uid
                }))
            })
        }
    } else {
        // Create new match
        await prisma.match.create({
            data: {
                date: parsedDate,
                opponent,
                type,
                ourScore,
                theirScore,
                result,
                attendances: {
                    create: attendances.map(uid => ({ userId: uid }))
                }
            }
        })
    }

    revalidatePath('/matches')
    revalidatePath('/') // 首页的累计比赛数等可能需要刷新
}

export async function deleteMatch(id: string) {
    // Prisma doesn't cascade automatically unless defined in schema, so delete children first
    await prisma.attendance.deleteMany({
        where: { matchId: id }
    })

    await prisma.match.delete({
        where: { id }
    })
    revalidatePath('/matches')
    revalidatePath('/')
}
