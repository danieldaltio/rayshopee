import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

const { SHOPEE_PARTNER_ID, SHOPEE_PARTNER_KEY, SHOPEE_API_URL, SHOPEE_ACCESS_TOKEN, SHOPEE_SHOP_ID } = process.env;

function generateSign(apiPath, timestamp) {
  const baseString = `${SHOPEE_PARTNER_ID}${apiPath}${timestamp}${SHOPEE_ACCESS_TOKEN}${SHOPEE_SHOP_ID}`;
  return crypto.createHmac('sha256', SHOPEE_PARTNER_KEY).update(baseString).digest('hex');
}

async function run() {
  const apiPath = '/api/v2/product/get_item_list';
  const timestamp = Math.floor(Date.now() / 1000);
  const sign = generateSign(apiPath, timestamp);
  const url = `${SHOPEE_API_URL}${apiPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp}&access_token=${SHOPEE_ACCESS_TOKEN}&shop_id=${SHOPEE_SHOP_ID}&sign=${sign}&item_status=NORMAL&offset=0&page_size=10`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (!data.response || !data.response.item || data.response.item.length === 0) {
    console.log("No items found:", data);
    return;
  }
  
  // Find an item that has variations
  let itemId = data.response.item[0].item_id;
  for (const item of data.response.item) {
    if (item.has_model) {
      itemId = item.item_id;
      break;
    }
  }

  console.log("Using ITEM_ID:", itemId);

  const modelPath = '/api/v2/product/get_model_list';
  const timestamp2 = Math.floor(Date.now() / 1000);
  const sign2 = generateSign(modelPath, timestamp2);
  const url2 = `${SHOPEE_API_URL}${modelPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp2}&access_token=${SHOPEE_ACCESS_TOKEN}&shop_id=${SHOPEE_SHOP_ID}&sign=${sign2}&item_id=${itemId}`;
  
  const res2 = await fetch(url2);
  const data2 = await res2.json();
  console.log("MODELS:", JSON.stringify(data2.response, null, 2));
}

run().catch(console.error);
