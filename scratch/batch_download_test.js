
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3003;
const BASE_URL = `http://localhost:${PORT}`;

async function batchDownloadTest() {
  console.log('--- Iniciando Teste de Download em Lote (50 pedidos) ---');
  
  // 1. Buscar pedidos dos últimos 15 dias
  const to = Math.floor(Date.now() / 1000);
  const from = to - 15 * 24 * 60 * 60;
  
  console.log(`Buscando pedidos de ${new Date(from * 1000).toLocaleDateString()} até hoje...`);
  
  const ordersRes = await fetch(`${BASE_URL}/api/xml-downloader/orders?time_from=${from}&time_to=${to}&status=ALL`);
  const ordersData = await ordersRes.json();
  
  if (!ordersData.orders || ordersData.orders.length === 0) {
    console.log('Nenhum pedido encontrado no período.');
    return;
  }
  
  const ordersWithKeys = ordersData.orders.filter(o => o.hasXml);
  console.log(`Encontrados ${ordersData.orders.length} pedidos, sendo ${ordersWithKeys.length} com chaves de acesso.`);
  
  const batch = ordersWithKeys.slice(0, 50);
  let successCount = 0;
  let failCount = 0;
  let shopeeFallbackCount = 0;

  for (const order of batch) {
    process.stdout.write(`Baixando ${order.orderSn}... `);
    try {
      const res = await fetch(`${BASE_URL}/api/xml-downloader/orders/${order.orderSn}/xml`);
      if (res.ok) {
        successCount++;
        process.stdout.write('✅ SUCESSO\n');
      } else {
        const err = await res.json();
        failCount++;
        process.stdout.write(`❌ FALHA (${err.code || 'ERRO'})\n`);
      }
    } catch (e) {
      failCount++;
      process.stdout.write(`❌ ERRO: ${e.message}\n`);
    }
  }

  console.log('\n--- Resultado do Lote ---');
  console.log(`Total tentado: ${batch.length}`);
  console.log(`Sucessos: ${successCount}`);
  console.log(`Falhas: ${failCount}`);
  console.log(`Taxa de Sucesso: ${((successCount / batch.length) * 100).toFixed(1)}%`);
}

batchDownloadTest();
