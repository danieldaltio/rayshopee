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

async function getAttributes(categoryId) {
    const apiPath = '/api/v2/product/get_attributes';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateSign(apiPath, timestamp);
    const url = `${BASE_URL}${apiPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp}&access_token=${SHOPEE_ACCESS_TOKEN}&shop_id=${SHOPEE_SHOP_ID}&sign=${sign}&category_id=${categoryId}`;

    const res = await fetch(url);
    const data = await res.json();
    
    const mandatory = data.response.attribute_list.filter(a => a.is_mandatory);
    console.log(JSON.stringify(mandatory, null, 2));
}

getAttributes(101223);
