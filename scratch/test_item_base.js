import dotenv from 'dotenv';
import crypto from 'crypto';
import fetch from 'node-fetch';

dotenv.config();

const {
  SHOPEE_PARTNER_ID,
  SHOPEE_PARTNER_KEY,
  SHOPEE_SHOP_ID,
  SHOPEE_ACCESS_TOKEN,
  SHOPEE_API_URL = 'https://partner.shopeemobile.com'
} = process.env;

function generateSign(apiPath, timestamp) {
  const baseString = `${SHOPEE_PARTNER_ID}${apiPath}${timestamp}${SHOPEE_ACCESS_TOKEN}${SHOPEE_SHOP_ID}`;
  return crypto.createHmac('sha256', SHOPEE_PARTNER_KEY).update(baseString).digest('hex');
}

async function testItemBase(itemId) {
  const apiPath = '/api/v2/product/get_item_base_info';
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateSign(apiPath, timestamp);

  const url = new URL(`${SHOPEE_API_URL}${apiPath}`);
  url.searchParams.set('partner_id', SHOPEE_PARTNER_ID);
  url.searchParams.set('timestamp', String(timestamp));
  url.searchParams.set('access_token', SHOPEE_ACCESS_TOKEN);
  url.searchParams.set('shop_id', SHOPEE_SHOP_ID);
  url.searchParams.set('sign', sign);
  url.searchParams.set('item_id_list', itemId);

  console.log('Fetching Base Info:', url.toString());
  const res = await fetch(url.toString());
  const data = await res.json();
  console.log('Response:', JSON.stringify(data, null, 2));
}

const itemId = process.argv[2] || '18145375310';
testItemBase(itemId);
