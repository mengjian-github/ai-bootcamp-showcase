import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const createPrismaClient = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // 在生产环境中，每隔一段时间重新创建客户端
  setInterval(() => {
    if (globalForPrisma.prisma) {
      globalForPrisma.prisma.$disconnect()
      globalForPrisma.prisma = createPrismaClient()
    }
  }, 300000) // 5分钟
}