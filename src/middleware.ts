import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 放行：登录页、静态资源、API 路由、favicon
    if (
        pathname.startsWith('/login') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/uploads') ||
        pathname.startsWith('/api') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next()
    }

    // 检查认证 Cookie
    const session = request.cookies.get('auth_session')
    if (!session?.value) {
        const loginUrl = new URL('/login', request.url)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        // 匹配所有路径，排除静态资源
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
}
