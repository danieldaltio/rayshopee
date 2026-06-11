import { PrismaService } from './src/prisma/prisma.service';
import { config } from 'dotenv';

config(); // Carrega o .env

async function main() {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  console.log('Buscando a primeira empresa no banco...');
  const company = await prisma.company.findFirst({
    orderBy: { created_at: 'asc' }
  });

  if (!company) {
    console.log('Nenhuma empresa encontrada no banco de dados. Cancelando migração de tenant.');
    await prisma.onModuleDestroy();
    return;
  }

  console.log(`Empresa encontrada: ${company.razao_social} (ID: ${company.id})`);
  const companyId = company.id;

  // Atualiza Products
  const productsResult = await prisma.products.updateMany({
    where: { company_id: null },
    data: { company_id: companyId },
  });
  console.log(`Atualizados ${productsResult.count} produtos.`);

  // Atualiza Customers
  const customersResult = await prisma.customer.updateMany({
    where: { company_id: null },
    data: { company_id: companyId },
  });
  console.log(`Atualizados ${customersResult.count} clientes.`);

  // Atualiza Orders
  const ordersResult = await prisma.order.updateMany({
    where: { company_id: null },
    data: { company_id: companyId },
  });
  console.log(`Atualizados ${ordersResult.count} pedidos.`);

  // Atualiza Invoices
  const invoicesResult = await prisma.invoice.updateMany({
    where: { company_id: null },
    data: { company_id: companyId },
  });
  console.log(`Atualizadas ${invoicesResult.count} faturas.`);

  console.log('Atribuição concluída com sucesso!');
  await prisma.onModuleDestroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
