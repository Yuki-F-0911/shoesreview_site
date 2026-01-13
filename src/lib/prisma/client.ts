import { PrismaClient } from '@prisma/client'

// Supabase Transaction Mode (port 6543) 使用時にpgbouncer=trueを自動付加
// これによりPrepared Statementエラーを回避する
let dbUrl = process.env.DATABASE_URL || '';
if (dbUrl.includes('6543') && !dbUrl.includes('pgbouncer=true')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${separator}pgbouncer=true`;
  process.env.DATABASE_URL = dbUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
