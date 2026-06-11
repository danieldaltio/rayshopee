import { PrismaClient } from './apps/RayHub/apps/api/src/prisma/prisma.service';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.order.count();
  console.log('PEDIDOS NO BANCO:', count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
