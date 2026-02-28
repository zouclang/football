import { PrismaClient } from '@prisma/client'
import { PrismaD1 } from '@prisma/adapter-d1'

const prismaClientSingleton = () => {
  // 在 Cloudflare 边缘环境且 D1 绑定可用时使用 D1 适配器
  if (process.env.DB && typeof process.env.DB !== 'undefined') {
    const adapter = new PrismaD1(process.env.DB as any)
    return new PrismaClient({ adapter })
  }
  // 本地开发或 Node.js 环境回退至标准驱动（读取 .env / URL）
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
