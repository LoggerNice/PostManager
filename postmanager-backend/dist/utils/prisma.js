import { PrismaClient } from '@prisma/client';
const prisma = globalThis.__prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
export default prisma;
//# sourceMappingURL=prisma.js.map