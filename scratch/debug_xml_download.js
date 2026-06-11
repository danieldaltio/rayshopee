
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3003;
const BASE_URL = `http://localhost:${PORT}`;

async function debug() {
  console.log('--- Debugging XML Download ---');
  
  // 1. Get a recent order with invoice
  const from = Math.floor(Date.now() / 1000) - 3 * 24 * 60 * 60; // 3 days ago
  const to = Math.floor(Date.now() / 1000);
  
  console.log(`Step 1: Searching orders from ${new Date(from * 1000).toISOString()}...`);
  const ordersRes = await fetch(`${BASE_URL}/api/xml-downloader/orders?time_from=${from}&time_to=${to}&status=ALL`);
  const ordersData = await ordersRes.json();
  
  const ordersWithKey = ordersData.orders?.filter(o => o.invoiceData?.accessKey) || [];
  console.log(`Found ${ordersWithKey.length} orders with access keys.`);
  
  if (ordersWithKey.length < 10) {
    console.log('Fewer than 10 orders with keys found. Trying the first one...');
  }
  
  const target = ordersWithKey[Math.min(9, ordersWithKey.length - 1)];
  console.log(`Step 2: Attempting download for Order: ${target.orderSn}, Key: ${target.invoiceData.accessKey}`);
  
  const xmlRes = await fetch(`${BASE_URL}/api/xml-downloader/orders/${target.orderSn}/xml`);
  if (xmlRes.ok) {
    const text = await xmlRes.text();
    console.log('SUCCESS! XML Content Preview:');
    console.log(text.substring(0, 500) + '...');
  } else {
    const err = await xmlRes.json();
    console.error('FAILED to download XML:', err);
  }
}

debug();
