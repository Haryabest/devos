import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client.
 *
 * Backend imports { prisma } from '@devos/db' — one connection pool per process.
 * Use `createPrismaClient()` in tests when you need an isolated instance.
 */

const globalForPrisma = globalThis as unknown as { __devosPrisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.__devosPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__devosPrisma = prisma;
}

export function createPrismaClient(): PrismaClient {
  return new PrismaClient();
}
