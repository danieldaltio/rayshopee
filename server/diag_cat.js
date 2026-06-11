import dotenv from 'dotenv';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const {
    SHOPEE_PARTNER_ID,
    SHOPEE_PARTNER_KEY,
    SHOPEE_SHOP_ID,
    SHOPEE_ACCESS_TOKEN
} = process.env;

const BASE_URL = 'https://openplatform.shopee.com.br';

function generateSign(apiPath, timestamp) {
    const baseString = `${SHOPEE_PARTNER_ID}${apiPath}${timestamp}${SHOPEE_ACCESS_TOKEN}${SHOPEE_SHOP_ID}`;
    return crypto.createHmac('sha256', SHOPEE_PARTNER_KEY).update(baseString).digest('hex');
}

async function getCategoryInfo(categoryId) {
    const apiPath = '/api/v2/product/get_attributes';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateSign(apiPath, timestamp);
    const url = `${BASE_URL}${apiPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp}&access_token=${SHOPEE_ACCESS_TOKEN}&shop_id=${SHOPEE_SHOP_ID}&sign=${sign}&category_id=${categoryId}`;

    console.log(`\n--- ATTRIBUTES FOR CATEGORY ${categoryId} ---`);
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));

    const brandPath = '/api/v2/product/get_brand_list';
    const brandTimestamp = Math.floor(Date.now() / 1000);
    const brandSign = generateSign(brandPath, brandTimestamp);
    const brandUrl = `${BASE_URL}${brandPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${brandTimestamp}&access_token=${SHOPEE_ACCESS_TOKEN}&shop_id=${SHOPEE_SHOP_ID}&sign=${brandSign}&category_id=${categoryId}&status=1`;

    console.log(`\n--- BRANDS FOR CATEGORY ${categoryId} ---`);
    const brandRes = await fetch(brandUrl);
    const brandData = await brandRes.json();
    console.log(JSON.stringify(brandData, null, 2));
}

getCategoryInfo(101223);
