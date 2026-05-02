const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { MultiFormatReader, BinaryBitmap, HybridBinarizer, RGBLuminanceSource, DecodeHintType } = require('@zxing/library');
const { Jimp } = require('jimp');
const axios = require('axios');

// State machine for user chat
const userState = {};

// RayShopee API URL
const RAYSHOPEE_API = 'http://localhost:3001/api';

function tryDecode(image) {
    try {
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        const imageData = image.bitmap.data;
        
        const luminances = new Uint8ClampedArray(width * height);
        for (let i = 0; i < width * height; i++) {
            const r = imageData[i * 4];
            const g = imageData[i * 4 + 1];
            const b = imageData[i * 4 + 2];
            luminances[i] = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
        }
        
        const source = new RGBLuminanceSource(luminances, width, height);
        const bitmap = new BinaryBitmap(new HybridBinarizer(source));
        
        const hints = new Map();
        hints.set(DecodeHintType.TRY_HARDER, true);
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15 
        ]);

        const reader = new MultiFormatReader();
        const result = reader.decode(bitmap, hints);
        return result.getText();
    } catch (err) {
        return null;
    }
}

async function decodeBarcode(buffer) {
    const originalImage = await Jimp.read(buffer);
    
    // 1. Try original
    let text = tryDecode(originalImage);
    if (text) return text;

    // 2. Try rotated 90 degrees (barcodes are often vertical in photos)
    let img = originalImage.clone().rotate(90);
    text = tryDecode(img);
    if (text) return text;

    // 3. Try high contrast + grayscale
    img = originalImage.clone().greyscale().contrast(0.5).normalize();
    text = tryDecode(img);
    if (text) return text;

    // 4. Try high contrast + grayscale + rotated
    img = img.rotate(90);
    text = tryDecode(img);
    if (text) return text;

    throw new Error('Não foi possível ler o código de barras da imagem. Tente focar melhor ou garanta boa iluminação.');
}

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

client.on('qr', (qr) => {
    console.log('Escaneie o QR Code abaixo com o seu WhatsApp para conectar:');
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('✅ Bot do WhatsApp conectado com sucesso!');
});

client.on('message_create', async msg => {
    // Ignore status messages and the bot's own responses
    if (msg.from === 'status@broadcast') return;
    if (msg.fromMe && (msg.body.includes('✅') || msg.body.includes('❌') || msg.body.includes('📸') || msg.body.includes('Olá! Eu sou'))) return;

    const chat = await msg.getChat();
    
    // Safety check: Only work in groups that have "Shopee" in the name, or in the chat with yourself.
    // This prevents the bot from reading photos in your family or friends groups!
    const isSelfChat = !chat.isGroup && msg.to === msg.from;
    const isShopeeGroup = chat.isGroup && chat.name.toLowerCase().includes('shopee');
    
    if (!isSelfChat && !isShopeeGroup) return;

    const from = msg.from;
    const text = msg.body.trim();

    // Check if user is in an active flow
    const state = userState[from];

    // If message has media (photo)
    if (msg.hasMedia) {
        const media = await msg.downloadMedia();
        if (media && media.mimetype.startsWith('image/')) {
            msg.reply('📸 Imagem recebida. Tentando ler o código de barras...');
            
            try {
                const buffer = Buffer.from(media.data, 'base64');
                const barcode = await decodeBarcode(buffer);
                
                userState[from] = {
                    step: 'AWAITING_PRICE_STOCK',
                    barcode: barcode
                };
                
                msg.reply(`✅ Código de barras identificado: *${barcode}*\n\nQual é o novo *Preço* e o novo *Estoque*?\nResponda no formato: \`Preço Estoque\`\nExemplo: \`15.90 10\``);
            } catch (err) {
                console.error(err);
                msg.reply('❌ ' + err.message);
            }
        } else {
            msg.reply('Por favor, envie uma foto do código de barras.');
        }
        return;
    }

    // Process text messages based on state
    if (state && state.step === 'AWAITING_PRICE_STOCK') {
        const parts = text.split(/\s+/);
        if (parts.length >= 2) {
            let priceStr = parts[0].replace(',', '.');
            let stockStr = parts[1];
            
            const price = parseFloat(priceStr);
            const stock = parseInt(stockStr, 10);
            const barcode = state.barcode;

            if (isNaN(price) || isNaN(stock)) {
                msg.reply('❌ Formato inválido. Por favor, envie no formato: \`Preço Estoque\` (Exemplo: 15.90 10). Ou digite "cancelar".');
                return;
            }

            msg.reply(`⏳ Buscando produto com o SKU (Código de Barras) *${barcode}* na RayShopee...`);

            try {
                // Fetch all products
                // Depending on the amount of products, we might need pagination.
                // Assuming all products can be fetched via few pages or search.
                let offset = 0;
                let hasMore = true;
                let targetProduct = null;

                while (hasMore) {
                    const res = await axios.get(`${RAYSHOPEE_API}/products?offset=${offset}&page_size=50`);
                    const data = res.data;
                    
                    const products = data.products || [];
                    targetProduct = products.find(p => p.sku === barcode);
                    
                    if (targetProduct) break;
                    
                    if (data.hasMore && data.nextOffset) {
                        offset = data.nextOffset;
                    } else {
                        hasMore = false;
                    }
                }

                if (!targetProduct) {
                    msg.reply(`❌ Nenhum produto encontrado com o código de barras (SKU) *${barcode}*. Verifique se o produto existe no seu inventário e tente novamente.`);
                    delete userState[from];
                    return;
                }

                // Call bulk-update API
                const updatePayload = {
                    updates: [
                        {
                            item_id: targetProduct.item_id,
                            model_id: targetProduct.model_id,
                            newPrice: price,
                            newStock: stock
                        }
                    ]
                };

                msg.reply(`Produto encontrado: *${targetProduct.name}* (Variação: ${targetProduct.variation}).\nAtualizando...`);

                const updateRes = await axios.post(`${RAYSHOPEE_API}/products/bulk-update`, updatePayload);

                if (updateRes.data && updateRes.data.success) {
                    msg.reply(`✅ *Sucesso!*\n\nProduto: ${targetProduct.name}\nSKU: ${barcode}\nNovo Preço: R$ ${price.toFixed(2)}\nNovo Estoque: ${stock}\n\nO sistema foi atualizado!`);
                } else {
                    msg.reply('❌ Houve um erro ao atualizar no sistema da Shopee. Verifique os logs do servidor RayShopee.');
                }
                
                delete userState[from];
            } catch (apiError) {
                console.error(apiError);
                msg.reply('❌ Erro de comunicação com o servidor RayShopee. Verifique se o servidor está rodando na porta 3001.');
                delete userState[from];
            }
        } else if (text.toLowerCase() === 'cancelar') {
            delete userState[from];
            msg.reply('Operação cancelada. Envie outra foto quando quiser.');
        } else {
            msg.reply('❌ Formato inválido. Por favor, envie no formato: \`Preço Estoque\` (Exemplo: 15.90 10). Ou digite "cancelar".');
        }
    } else {
        // Idle state, simple text received
        if (text.toLowerCase() === 'ping') {
            msg.reply('pong');
        } else {
            msg.reply('Olá! Eu sou o Bot da RayShopee. 🛒\n\nPara alterar o preço e estoque de um produto, *tire uma foto do código de barras* e envie aqui!');
        }
    }
});

client.initialize();
