import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

const prismaClientSingleton = () => {
  // 1. 生产环境：尝试从环境变量获取 D1 绑定 (Cloudflare Pages 环境)
  const db = (process.env as any).DB
  if (db) {
    try {
      const adapter = new PrismaD1(db)
      return new PrismaClient({ adapter: adapter as any })
    } catch (e) {
      console.error('Failed to init D1 adapter:', e)
    }
  }

  // 2. 边缘环境回退（处理 Next.js 构建阶段的预渲染/静态收集）
  // 使用 Proxy 确保所有被调用的方法都返回 Mock 数据，且不会因 missing bind 而崩溃
  if (typeof (globalThis as any).EdgeRuntime === 'string') {
    const mockResultSet = { columnNames: [], columnTypes: [], rows: [] };
    const mockAdapter = new Proxy({}, {
      get: (target, prop) => {
        if (prop === 'provider') return 'sqlite'
        if (prop === 'adapterName') return 'mock'
        if (prop === 'transactionContext') return async () => ({
          queryRaw: async () => mockResultSet,
          executeRaw: async () => 0,
          commit: async () => { },
          rollback: async () => { },
        })
        return async () => mockResultSet
      }
    })
    return new PrismaClient({ adapter: mockAdapter as any })
  }

  // 3. 本地 Node.js 环境回退至标准驱动 (读取 .env / DATABASE_URL)
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
