"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type PlayerInput = {
    id?: string
    name: string
    birthDate?: string | null
    enrollmentYear?: string | null
    major?: string | null
    jerseyNumber?: string | null
    jerseySize?: string | null
    profilePhoto?: string | null
    suzhouProofType?: string | null
    suzhouProofUrl?: string | null
    educationProofType?: string | null
    educationProofUrl?: string | null
    positions?: string | null
    teamRole?: string | null
    isActive?: boolean
    isMember?: boolean
}

export async function getPlayers() {
    return prisma.user.findMany({
        orderBy: {
            name: 'asc'
        }
    })
}

export async function getPlayer(id: string) {
    return prisma.user.findUnique({
        where: { id }
    })
}

export async function savePlayer(player: PlayerInput) {
    try {
        if (player.id) {
            await prisma.user.update({
                where: { id: player.id },
                data: {
                    name: player.name,
                    birthDate: player.birthDate,
                    enrollmentYear: player.enrollmentYear,
                    major: player.major,
                    jerseyNumber: player.jerseyNumber,
                    jerseySize: player.jerseySize,
                    profilePhoto: player.profilePhoto,
                    suzhouProofType: player.suzhouProofType,
                    suzhouProofUrl: player.suzhouProofUrl,
                    educationProofType: player.educationProofType,
                    educationProofUrl: player.educationProofUrl,
                    positions: player.positions,
                    teamRole: player.teamRole,
                    isActive: player.isActive ?? true,
                    isMember: player.isMember ?? false,
                }
            })
        } else {
            await prisma.user.create({
                data: {
                    name: player.name,
                    birthDate: player.birthDate,
                    enrollmentYear: player.enrollmentYear,
                    major: player.major,
                    jerseyNumber: player.jerseyNumber,
                    jerseySize: player.jerseySize,
                    profilePhoto: player.profilePhoto,
                    suzhouProofType: player.suzhouProofType,
                    suzhouProofUrl: player.suzhouProofUrl,
                    educationProofType: player.educationProofType,
                    educationProofUrl: player.educationProofUrl,
                    positions: player.positions,
                    teamRole: player.teamRole,
                    isActive: player.isActive ?? true,
                    isMember: player.isMember ?? false,
                }
            })
        }

        revalidatePath('/players')
        revalidatePath('/') // #9: 首页展示球员人数，需一并刷新
    } catch (error) {
        console.error("服务端保存队员失败:", error)
        throw new Error("服务端保存队员失败")
    }
}

export async function deletePlayer(id: string) {
    // #1: 先删关联子表，避免 SQLite 外键约束错误
    await prisma.attendance.deleteMany({ where: { userId: id } })
    await prisma.personalTransaction.deleteMany({ where: { userId: id } })
    await prisma.user.delete({ where: { id } })
    revalidatePath('/players')
    revalidatePath('/') // #9: 首页展示球员人数，需一并刷新
}
