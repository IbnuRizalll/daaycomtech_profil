import { Prisma, PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const normalizeDatabaseUrl = (value?: string) => {
  const raw = (value ?? '').trim()
  if (!raw) return raw

  const hasMatchingDoubleQuotes = raw.startsWith('"') && raw.endsWith('"')
  const hasMatchingSingleQuotes = raw.startsWith("'") && raw.endsWith("'")
  const unwrapped = hasMatchingDoubleQuotes || hasMatchingSingleQuotes ? raw.slice(1, -1).trim() : raw
  return unwrapped
}

const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)

if (databaseUrl && process.env.DATABASE_URL !== databaseUrl) {
  process.env.DATABASE_URL = databaseUrl
}

const prismaOptions: Prisma.PrismaClientOptions = databaseUrl
  ? {
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
    }
  : {}

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions)

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
