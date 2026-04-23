import { PrismaClient } from '@prisma/client';
import path from 'path';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const dbUrl = process.env.DATABASE_URL?.startsWith('file:./')
  ? `file:${path.resolve(process.cwd(), process.env.DATABASE_URL.slice(5))}`
  : process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ datasources: { db: { url: dbUrl } } });

// Enable WAL mode for better multi-user concurrency (concurrent reads during writes)
if (!globalForPrisma.prisma) {
  prisma.$executeRawUnsafe('PRAGMA journal_mode=WAL').catch(() => {});
  prisma.$executeRawUnsafe('PRAGMA busy_timeout=5000').catch(() => {});
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
