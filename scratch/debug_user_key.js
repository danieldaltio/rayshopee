
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.PORT || 3003;
const BASE_URL = `http://localhost:${PORT}`;

async function debugSpecific() {
  const accessKey = '35250944156548000109550020000025651530845026';
  console.log(`--- Debugging Specific Access Key: ${accessKey} ---`);
  
  const res = await fetch(`${BASE_URL}/api/xml-downloader/access-key/${accessKey}`);
  if (res.ok) {
    const text = await res.text();
    console.log('SUCCESS! XML Content Preview:');
    console.log(text.substring(0, 1000) + '...');
  } else {
    const err = await res.json();
    console.error('FAILED to download XML:', err);
  }
}

debugSpecific();
