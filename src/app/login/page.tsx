import { LoginClient } from '@/components/LoginClient'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function LoginPage() {
    // 如果已经登录，直接跳转首页
    const session = await getSession()
    if (session) redirect('/')

    return <LoginClient />
}
