
import { PrismaClient } from '@prisma/client';

async function checkDb() {
  const prisma = new PrismaClient();
  try {
    const magicTcg = await (prisma as any).tcgs.findUnique({
      where: { name: 'Magic' }
    });
    console.log('Magic TCG:', magicTcg);

    const cards = await (prisma as any).singles.findMany({
      where: {
        cardName: { contains: 'One Ring', mode: 'insensitive' }
      },
      include: {
        tcgs: true
      }
    });
    console.log('Found cards:', cards.length);
    cards.forEach(c => console.log(`- ${c.cardName} (${c.tcgs?.name}) [${c.id}]`));
  } catch (err) {
    console.error('DB check failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkDb();
