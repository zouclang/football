// #8: 统一的 cn() 工具函数，供全局组件使用（Navbar 和 page.tsx 不再各自定义）
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
