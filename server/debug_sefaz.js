import { initSefazService, tryDownloadInvoice } from './sefaz-service.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  console.log('[DEBUG] Inicializando SEFAZ...');
  await initSefazService();
  
  const orderSn = "2604197548K1HU";
  const accessKey = "35260444156548000109550020000061581273798500";
  
  console.log(`[DEBUG] Tentando baixar XML para chave: ${accessKey}`);
  const result = await tryDownloadInvoice(orderSn, accessKey);
  
  if (result.success) {
    console.log('[DEBUG] SUCESSO! XML baixado.');
    console.log('[DEBUG] Conteúdo (primeiros 200 caracteres):', result.content.substring(0, 200));
  } else {
    console.log('[DEBUG] FALHA:', result.error);
  }
}

run().catch(err => console.error(err));
