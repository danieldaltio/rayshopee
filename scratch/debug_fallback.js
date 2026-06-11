
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3003;
const BASE_URL = `http://localhost:${PORT}`;

async function debugWithFallback() {
  const orderSn = '250906S7KYEK6D';
  console.log(`--- Debugging Order: ${orderSn} with Shopee Fallback ---`);
  
  const res = await fetch(`${BASE_URL}/api/xml-downloader/orders/${orderSn}/xml`);
  if (res.ok) {
    const text = await res.text();
    console.log('SUCCESS! XML Content Preview:');
    console.log(text.substring(0, 500) + '...');
  } else {
    const err = await res.json();
    console.error('FAILED to download XML:', err);
    console.log('Check server logs for Shopee fallback details.');
  }
}

debugWithFallback();
