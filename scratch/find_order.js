
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3003;
const BASE_URL = `http://localhost:${PORT}`;

async function checkOrderDetail() {
  const orderSn = '250906S7KYEK6D';
  console.log(`--- Checking Order Detail for: ${orderSn} ---`);
  
  // Since I don't have a direct endpoint for getOrderDetail, I'll use the search endpoint with a narrow range
  // and then I'll call a custom endpoint if I had one, or I'll just check the server logs.
  // Wait! I can add a temporary route to index.js to call getOrderDetail directly and return the RAW response.
}

// Actually, I'll just look at the server logs if I trigger a search that includes this order.
// But the date 2025-09-06 is in the past.
// Today is 2026-05-13.
// So I need to search around 2025-09-06.

async function searchSpecific() {
  const date = new Date('2025-09-06T11:13:00').getTime() / 1000;
  const from = Math.floor(date) - 3600; // 1 hour before
  const to = Math.floor(date) + 3600;   // 1 hour after
  
  console.log(`Searching orders around ${new Date(date * 1000).toISOString()}...`);
  const res = await fetch(`${BASE_URL}/api/xml-downloader/orders?time_from=${from}&time_to=${to}&status=ALL`);
  const data = await res.json();
  
  const order = data.orders?.find(o => o.orderSn === '250906S7KYEK6D');
  if (order) {
    console.log('Order Found!', JSON.stringify(order, null, 2));
  } else {
    console.log('Order NOT found in this range. Total orders in range:', data.orders?.length);
    // Maybe search a wider range?
  }
}

searchSpecific();
