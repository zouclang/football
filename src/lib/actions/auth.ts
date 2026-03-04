"use server"

import prisma from '../prisma'
import { setSession, clearSession } from '../auth'
import { redirect } from 'next/navigation'

export async function loginAsAdmin(password: string) {
    const adminPwd = process.env.ADMIN_PASSWORD
    if (!adminPwd) throw new Error('服务端未配置管理员密码')

    if (password !== adminPwd) {
        return { error: '管理员密码错误' }
    }

    await setSession({ role: 'admin' })
    redirect('/')
}

export async function loginAsPlayer(name: string, password: string) {
    const playerPwd = process.env.PLAYER_PASSWORD
    if (!playerPwd) throw new Error('服务端未配置队员密码')

    if (password !== playerPwd) {
        return { error: '队员密码错误' }
    }

    // 在数据库中查找该姓名的球员
    const player = await prisma.user.findFirst({
        where: { name: name.trim() }
    })

    if (!player) {
        return { error: `未找到名为「${name.trim()}」的球员，请确认姓名与系统中一致` }
    }

    await setSession({
        role: 'player',
        playerId: player.id,
        playerName: player.name
    })
    redirect('/')
}

export async function logoutAction() {
    await clearSession()
    redirect('/login')
}
