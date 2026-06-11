
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3003;
const BASE_URL = `http://localhost:${PORT}`;

async function findRecentAndLog() {
  const to = Math.floor(Date.now() / 1000);
  const from = to - 3 * 24 * 60 * 60;
  
  console.log(`Buscando pedidos recentes...`);
  const res = await fetch(`${BASE_URL}/api/xml-downloader/orders?time_from=${from}&time_to=${to}&status=ALL`);
  const data = await res.json();
  
  if (data.orders?.length > 0) {
    const order = data.orders[0];
    console.log('--- Order Sample ---');
    console.log(JSON.stringify(order, null, 2));
  }
}

findRecentAndLog();
