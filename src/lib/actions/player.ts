"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type PlayerInput = {
    id?: string
    name: string
    birthDate?: string
    enrollmentYear?: string
    major?: string
    jerseyNumber?: string
    jerseySize?: string
    profilePhoto?: string
    suzhouProofType?: string
    suzhouProofUrl?: string
    educationProofType?: string
    educationProofUrl?: string
}

export async function getPlayers() {
    return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' }
    })
}

export async function getPlayer(id: string) {
    return await prisma.user.findUnique({
        where: { id }
    })
}

// #6: 过滤空字符串，避免用空值覆盖数据库已有数据
function cleanStr(v: string | undefined): string | undefined {
    return v && v.trim() !== '' ? v : undefined
}

export async function savePlayer(data: PlayerInput) {
    const { id, ...rest } = data

    const cleaned = {
        name: rest.name,
        birthDate: cleanStr(rest.birthDate),
        enrollmentYear: cleanStr(rest.enrollmentYear),
        major: cleanStr(rest.major),
        jerseyNumber: cleanStr(rest.jerseyNumber),
        jerseySize: cleanStr(rest.jerseySize),
        profilePhoto: cleanStr(rest.profilePhoto),
        suzhouProofType: cleanStr(rest.suzhouProofType),
        suzhouProofUrl: cleanStr(rest.suzhouProofUrl),
        educationProofType: cleanStr(rest.educationProofType),
        educationProofUrl: cleanStr(rest.educationProofUrl),
    }

    if (id) {
        await prisma.user.update({
            where: { id },
            data: cleaned
        })
    } else {
        await prisma.user.create({
            data: cleaned
        })
    }

    revalidatePath('/players')
    revalidatePath('/') // #9: 首页展示球员人数，需一并刷新
}

export async function deletePlayer(id: string) {
    // #1: 先删关联子表，避免 SQLite 外键约束错误
    await prisma.attendance.deleteMany({ where: { userId: id } })
    await prisma.personalTransaction.deleteMany({ where: { userId: id } })
    await prisma.user.delete({ where: { id } })
    revalidatePath('/players')
    revalidatePath('/') // #9: 首页展示球员人数，需一并刷新
}
