
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

async function test() {
  const from = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  const to = Math.floor(Date.now() / 1000);
  
  console.log(`Testing /api/xml-downloader/orders with from=${from}, to=${to}`);
  
  try {
    const res = await fetch(`${BASE_URL}/api/xml-downloader/orders?time_from=${from}&time_to=${to}&status=ALL`);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
