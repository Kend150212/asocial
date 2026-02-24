import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const connStr = process.env.DATABASE_URL
  if (!connStr) {
    throw new Error('[Prisma] DATABASE_URL is not set — check your .env file')
  }
  const pool = new pg.Pool({ connectionString: connStr })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

/**
 * Lazy-initialized Prisma client.
 * Uses a getter so `pg.Pool` reads DATABASE_URL at first access,
 * not at module import time (fixes worker process where dotenv
 * may not have loaded yet due to ES module import hoisting).
 */
let _prisma: PrismaClient | undefined = globalForPrisma.prisma

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    if (!_prisma) {
      _prisma = createPrismaClient()
      globalForPrisma.prisma = _prisma
    }
    return (_prisma as any)[prop]
  },
})
