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

async function testAddItem() {
    const apiPath = '/api/v2/product/add_item';
    const timestamp = Math.floor(Date.now() / 1000);
    const sign = generateSign(apiPath, timestamp);

    const url = `${BASE_URL}${apiPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp}&access_token=${SHOPEE_ACCESS_TOKEN}&shop_id=${SHOPEE_SHOP_ID}&sign=${sign}`;

    const payload = {
        "category_id": 101223,
        "item_name": "TESTE FINAL 2026 - UTENSILIO CHURRASCO " + timestamp,
        "description": "Descricao de teste para validacao de marca. Este item sera excluido e deve ter pelo menos dez caracteres.",
        "brand": {
            "brand_id": 0,
            "original_brand_name": "No Brand"
        },
        "original_price": 49.99,
        "seller_stock": [
            {
                "stock": 15
            }
        ],
        "item_sku": "TEST-SKU-" + timestamp,
        "weight": 0.5,
        "dimension": {
            "package_height": 10,
            "package_width": 10,
            "package_length": 10
        },
        "condition": "NEW",
        "item_status": "NORMAL",
        "image": {
            "image_id_list": ["br-11134207-7r98o-lx3456789"] // Usando ID fake para teste de estrutura
        },
        "logistic_info": [
            {
                "logistic_id": 50012,
                "enabled": true
            }
        ],
        "item_dangerous": 0
    };

    console.log('--- PAYLOAD ---');
    console.log(JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        console.log('\n--- RESPONSE ---');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('\n--- ERROR ---');
        console.error(error);
    }
}

testAddItem();
