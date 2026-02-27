"use server"

import prisma from '../prisma'
import { revalidatePath } from 'next/cache'

export type TeamInfoInput = {
    foundationDate?: string
    groupPhotoUrl?: string
    highlightPhotos?: string
}

export async function getTeamInfo() {
    const infoList = await prisma.teamInfo.findMany()
    if (infoList.length === 0) {
        return await prisma.teamInfo.create({
            data: {}
        })
    }
    return infoList[0]
}

export async function updateTeamInfo(data: TeamInfoInput) {
    const current = await getTeamInfo()
    await prisma.teamInfo.update({
        where: { id: current.id },
        data
    })
    revalidatePath('/team')
}
