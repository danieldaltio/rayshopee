import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const partnerId = parseInt(process.env.SHOPEE_PARTNER_ID);
const partnerKey = process.env.SHOPEE_PARTNER_KEY;
const shopId = parseInt(process.env.SHOPEE_SHOP_ID);
const accessToken = process.env.SHOPEE_ACCESS_TOKEN;
const host = "partner.shopeemobile.com";

function signRequest(path, timestamp, accessToken, shopId) {
  const baseStr = partnerId + path + timestamp + accessToken + shopId;
  return crypto.createHmac('sha256', partnerKey).update(baseStr).digest('hex');
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function getOrderDetail(orderSn) {
  const timestamp = Math.floor(Date.now() / 1000);
  const path = "/api/v2/order/get_order_detail";
  const sign = signRequest(path, timestamp, accessToken, shopId);
  const url = `https://${host}${path}?partner_id=${partnerId}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${sign}&order_sn_list=${orderSn}&response_optional_fields=invoice_data`;

  return getJson(url);
}

const orderSn = "2604197548K1HU";
getOrderDetail(orderSn).then(res => {
  const order = res.response?.order_list?.[0];
  if (order?.invoice_data?.access_key) {
    console.log('ACCESS_KEY:', order.invoice_data.access_key);
  } else {
    console.log('Order not found or no access_key:', orderSn);
    console.log('Full response:', JSON.stringify(res, null, 2));
  }
}).catch(err => console.error(err));
