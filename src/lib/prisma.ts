import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
  })

  // PRAGMA 在 SQLite 中返回结果集，必须用 $queryRawUnsafe
  client.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch(() => { })
  client.$queryRawUnsafe('PRAGMA cache_size=-32000;').catch(() => { })
  client.$queryRawUnsafe('PRAGMA synchronous=NORMAL;').catch(() => { })
  client.$queryRawUnsafe('PRAGMA temp_store=MEMORY;').catch(() => { })

  return client
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
