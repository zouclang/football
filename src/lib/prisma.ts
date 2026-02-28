import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

const prismaClientSingleton = () => {
  // 在 Cloudflare 边缘环境且 D1 绑定可用时使用 D1 适配器
  if (process.env.DB && typeof process.env.DB !== 'undefined') {
    const adapter = new PrismaD1(process.env.DB as any)
    // 使用 as any 规避某些环境下 DriverAdapter 接口定义的微小不一致报错
    return new PrismaClient({ adapter: adapter as any })
  }

  // 特殊处理：如果处于 Edge Runtime 环境但没有 DB 绑定（通常是 Next.js 构建阶段的预渲染）
  // 此时绝对不能初始化标准的 PrismaClient (它会尝试加载 Node.js 原生驱动并导致崩溃)
  // 我们返回一个空适配器的客户端，因为构建阶段我们不需要真实数据
  if (typeof (globalThis as any).EdgeRuntime === 'string') {
    return new PrismaClient({
      adapter: {
        queryRaw: async () => [],
        executeRaw: async () => 0,
        provider: 'sqlite',
      } as any
    })
  }

  // 真正的本地开发环境 (Node.js)
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
