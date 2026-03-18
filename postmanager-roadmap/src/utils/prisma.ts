import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __roadmapPrisma: PrismaClient | undefined;
}

export const prisma =
  global.__roadmapPrisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.__roadmapPrisma = prisma;
}

