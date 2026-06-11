
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3003;
const BASE_URL = `http://localhost:${PORT}`;

async function checkCnpjs() {
  const from = Math.floor(Date.now() / 1000) - 15 * 24 * 60 * 60; // 15 days ago
  const to = Math.floor(Date.now() / 1000);
  
  const res = await fetch(`${BASE_URL}/api/xml-downloader/orders?time_from=${from}&time_to=${to}&status=ALL`);
  const data = await res.json();
  
  const cnpjs = new Set();
  (data.orders || []).forEach(o => {
    if (o.invoiceData?.accessKey) {
      const cnpj = o.invoiceData.accessKey.substring(6, 20);
      cnpjs.add(cnpj);
    }
  });
  
  console.log('Unique CNPJs found in order access keys:', Array.from(cnpjs));
  console.log('Configured CNPJ:', process.env.SEFAZ_CNPJ);
}

checkCnpjs();
