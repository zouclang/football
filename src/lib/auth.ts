"use server"

import { cookies } from 'next/headers'

export type AuthSession = {
    role: 'admin' | 'player'
    playerId?: string
    playerName?: string
}

const COOKIE_NAME = 'auth_session'

export async function getSession(): Promise<AuthSession | null> {
    const cookieStore = await cookies()
    const raw = cookieStore.get(COOKIE_NAME)?.value
    if (!raw) return null

    try {
        return JSON.parse(decodeURIComponent(raw)) as AuthSession
    } catch {
        return null
    }
}

export async function setSession(session: AuthSession) {
    const cookieStore = await cookies()
    cookieStore.set(COOKIE_NAME, encodeURIComponent(JSON.stringify(session)), {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 30 天
        sameSite: 'lax',
    })
}

export async function clearSession() {
    const cookieStore = await cookies()
    cookieStore.delete(COOKIE_NAME)
}

// 权限校验辅助：非管理员禁止写操作
export async function requireAdmin() {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        throw new Error('权限不足：仅管理员可执行此操作')
    }
    return session
}

// 权限校验辅助：至少要登录
export async function requireAuth() {
    const session = await getSession()
    if (!session) {
        throw new Error('未登录')
    }
    return session
}
