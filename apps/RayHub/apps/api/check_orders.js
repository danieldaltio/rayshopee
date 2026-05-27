require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const updatedRecently = await prisma.order.count({
      where: {
        data_atualizacao: {
          gte: twoMinutesAgo
        }
      }
    });

    console.log(`Orders updated in the last 2 minutes: ${updatedRecently}`);

    const latestOrder = await prisma.order.findFirst({
      orderBy: {
        data_atualizacao: 'desc'
      }
    });
    if (latestOrder) {
      console.log(`Latest updated order: ${latestOrder.shopee_order_sn} at ${latestOrder.data_atualizacao}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
