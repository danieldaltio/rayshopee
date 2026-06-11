import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

async function test() {
  const accessToken = process.env.SHOPEE_ACCESS_TOKEN;
  const shopId = process.env.SHOPEE_SHOP_ID;
  const partnerId = process.env.SHOPEE_PARTNER_ID;
  const partnerKey = process.env.SHOPEE_PARTNER_KEY;
  
  const apiPath = '/api/v2/product/get_model_list';
  const timestamp = Math.floor(Date.now() / 1000);
  const baseString = `${partnerId}${apiPath}${timestamp}${accessToken}${shopId}`;
  const sign = crypto.createHmac('sha256', partnerKey).update(baseString).digest('hex');
  
  const url = `https://partner.shopeemobile.com${apiPath}?partner_id=${partnerId}&timestamp=${timestamp}&access_token=${accessToken}&shop_id=${shopId}&sign=${sign}&item_id=23492840483`;
  
  const res = await fetch(url);
  const text = await res.text();
  console.log(text);
}

test();
