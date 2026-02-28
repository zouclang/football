"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type TournamentInput = {
    id?: string
    name: string
    startDate?: string | null
    endDate?: string | null
    entryFee?: number
    deposit?: number
    deduction?: number
    finalRank?: string | null
    notes?: string | null
    playerIds?: string[]
}

export async function getTournaments() {
    return prisma.tournament.findMany({
        include: {
            players: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
}

export async function saveTournament(data: TournamentInput) {
    try {
        if (data.id) {
            await prisma.tournament.update({
                where: { id: data.id },
                data: {
                    name: data.name,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    entryFee: data.entryFee ?? 0,
                    deposit: data.deposit ?? 0,
                    deduction: data.deduction ?? 0,
                    finalRank: data.finalRank,
                    notes: data.notes,
                    players: data.playerIds ? { set: data.playerIds.map(id => ({ id })) } : { set: [] }
                }
            })
        } else {
            await prisma.tournament.create({
                data: {
                    name: data.name,
                    startDate: data.startDate,
                    endDate: data.endDate,
                    entryFee: data.entryFee ?? 0,
                    deposit: data.deposit ?? 0,
                    deduction: data.deduction ?? 0,
                    finalRank: data.finalRank,
                    notes: data.notes,
                    players: data.playerIds ? { connect: data.playerIds.map(id => ({ id })) } : undefined
                }
            })
        }
        revalidatePath('/tournaments')
    } catch (e) {
        console.error("Save tournament failed:", e)
        throw new Error("保存赛事信息失败")
    }
}

export async function deleteTournament(id: string) {
    try {
        await prisma.tournament.delete({
            where: { id }
        })
        revalidatePath('/tournaments')
    } catch (e) {
        console.error("Delete tournament failed:", e)
        throw new Error("删除赛事失败")
    }
}
