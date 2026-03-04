"use client"

/**
 * 客户端懒加载 FinanceClient。
 * next/dynamic 的 ssr:false 只能在 Client Component 中使用，
 * 所以通过这个薄包装层来承载动态导入，避免把 85KB 的财务组件
 * 打入首屏 JS bundle。
 */
import nextDynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import type { FinanceClient as FinanceClientType } from './FinanceClient'

const FinanceClient = nextDynamic(
    () => import('./FinanceClient').then(m => ({ default: m.FinanceClient })),
    {
        loading: () => (
            <div className="flex items-center justify-center h-64 text-slate-400">
                <div className="animate-pulse text-lg">财务数据加载中...</div>
            </div>
        ),
        ssr: false
    }
)

export function FinanceClientLoader(props: ComponentProps<typeof FinanceClientType>) {
    return <FinanceClient {...props} />
}
