import { prisma } from '../utils/prisma.js';

async function main() {
  await prisma.roadmap.upsert({
    where: { key: 'default' },
    update: {},
    create: {
      key: 'default',
      title: 'Roadmap',
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

