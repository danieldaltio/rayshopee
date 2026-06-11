
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3003;
const BASE_URL = `http://localhost:${PORT}`;

async function syncAndCheck() {
  const targetKey = '35250944156548000109550020000025651530845026';
  console.log(`--- Syncing SEFAZ to find key: ${targetKey} ---`);
  
  // We'll use the new sync route
  const from = Math.floor(new Date('2025-09-01').getTime() / 1000);
  const to = Math.floor(new Date('2025-09-10').getTime() / 1000);
  
  const res = await fetch(`${BASE_URL}/api/xml-downloader/sync-sefaz?time_from=${from}&time_to=${to}`);
  const data = await res.json();
  console.log('Sync result:', data);
  
  // Check if it's in cache now
  const xmlRes = await fetch(`${BASE_URL}/api/xml-downloader/access-key/${targetKey}`);
  if (xmlRes.ok) {
    console.log('SUCCESS! Key found in distribution sync.');
  } else {
    console.log('STILL NOT FOUND.');
  }
}

syncAndCheck();
