import { initSefazService, getXmlsFromSefazByPeriod } from './sefaz-service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  console.log('[DEBUG] Inicializando SEFAZ...');
  await initSefazService();
  
  const now = Math.floor(Date.now() / 1000);
  const timeFrom = now - (2 * 24 * 3600); // 2 days ago
  const timeTo = now;
  
  console.log(`[DEBUG] Buscando documentos via NSU para os últimos 2 dias...`);
  const xmls = await getXmlsFromSefazByPeriod(timeFrom, timeTo);
  
  console.log(`[DEBUG] Documentos encontrados: ${xmls.length}`);
  if (xmls.length > 0) {
    xmls.forEach((x, i) => {
      console.log(`[${i}] Chave: ${x.chave} | Data: ${x.dhEmi} | CNPJ: ${x.emitCnpj}`);
    });
  }
}

run().catch(err => console.error(err));
