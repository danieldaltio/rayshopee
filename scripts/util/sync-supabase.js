import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = "https://xcvazbfjkiddzlxwynni.supabase.co";
const SUPABASE_KEY = "sb_publishable_RTWk8m9hY8S6KAhFBCY3rw_d9Kw3-Fw";

const SHOPEE_PARTNER_ID = "2033681";
const SHOPEE_PARTNER_KEY = "shpk4a6252796a70685050567067776267416d6168655744716772694f4c794c";
const SHOP_ID = "263124677";

const accessToken = "526f43744548716370554274486e7070";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function generateAuthSign(apiPath) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const baseString = SHOPEE_PARTNER_ID + apiPath + timestamp + accessToken + SHOP_ID;
  const sign = crypto.createHmac('sha256', SHOPEE_PARTNER_KEY).update(baseString).digest('hex');
  return { timestamp, sign };
}

async function getItemList(offset = 0, status = 'NORMAL') {
  const apiPath = '/api/v2/product/get_item_list';
  const { timestamp, sign } = generateAuthSign(apiPath);
  
  const url = `https://partner.shopeemobile.com${apiPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp}&shop_id=${SHOP_ID}&page_size=50&offset=${offset}&item_status=${status}&sign=${sign}&access_token=${accessToken}`;
  
  const response = await fetch(url);
  return response.json();
}

async function getItemBaseInfo(itemIds) {
  const apiPath = '/api/v2/product/get_item_base_info';
  const { timestamp, sign } = generateAuthSign(apiPath);
  
  const url = `https://partner.shopeemobile.com${apiPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp}&shop_id=${SHOP_ID}&item_id_list=${itemIds.join(',')}&sign=${sign}&access_token=${accessToken}`;
  
  const response = await fetch(url);
  return response.json();
}

async function getItemModelList(itemIds) {
  const apiPath = '/api/v2/product/get_item_model_list';
  const { timestamp, sign } = generateAuthSign(apiPath);
  
  const url = `https://partner.shopeemobile.com${apiPath}?partner_id=${SHOPEE_PARTNER_ID}&timestamp=${timestamp}&shop_id=${SHOP_ID}&item_id_list=${itemIds.join(',')}&sign=${sign}&access_token=${accessToken}`;
  
  const response = await fetch(url);
  return response.json();
}

async function syncFromShopee() {
  console.log('🔄 Starting full sync from Shopee...');
  
  // Get all item IDs from Shopee
  console.log('\n📋 Fetching item list from Shopee...');
  let offset = 0;
  let allItemIds = [];
  
  while (offset < 2000) {
    const listData = await getItemList(offset);
    
    if (listData.error) {
      console.error('Error:', listData);
      break;
    }
    
    const items = listData.response?.item || [];
    if (items.length === 0) break;
    
    allItemIds.push(...items.map(i => i.item_id));
    console.log('  Got ' + items.length + ' items (total: ' + allItemIds.length + ')');
    
    if (items.length < 50) break;
    offset += 50;
  }
  
  console.log('\n📦 Total items to sync: ' + allItemIds.length);
  
  // Process in batches of 10
  const batchSize = 10;
  let totalSaved = 0;
  let pricesFound = 0;
  let pricesNotFound = 0;
  
  for (let i = 0; i < allItemIds.length; i += batchSize) {
    const batchIds = allItemIds.slice(i, i + batchSize);
    console.log('\n🔄 Processing batch ' + (Math.floor(i/batchSize) + 1) + '/' + (Math.ceil(allItemIds.length/batchSize)) + ': items ' + (i+1) + '-' + (i+batchIds.length));
    
    try {
      const baseInfo = await getItemBaseInfo(batchIds);
      const items = baseInfo.response?.item_list || [];
      
      let modelsMap = {};
      try {
        const modelInfo = await getItemModelList(batchIds);
        if (modelInfo.response) {
          for (const item of modelInfo.response) {
            modelsMap[item.item_id] = item.model_list || [];
          }
        }
      } catch (e) {
        console.log('  Note: Could not get models for some items');
      }
      
      for (const item of items) {
        const models = modelsMap[item.item_id] || [];
        
        if (models.length > 0) {
          for (const model of models) {
            let price = parseFloat(model.price_info?.before_discount?.price) || 
                        parseFloat(model.price) || 0;
            let stock = parseInt(model.stock_info?.total_available) || 
                         parseInt(model.stock) || 0;
            
            const sku = model.model_sku || item.item_id + '-' + model.model_id;
            
            if (price > 0) pricesFound++;
            else pricesNotFound++;
            
            // Update if API returns valid price (> 0)
            if (price > 0) {
              const { error } = await supabase.from('products').upsert({
                sku: sku,
                shopee_price: price,
                shopee_stock: stock,
                last_sync: new Date().toISOString()
              }, { onConflict: 'sku' });
              
              if (!error) totalSaved++;
            }
          }
        } else {
          let price = parseFloat(item.price_info?.[0]?.current_price) || 0;
          let stock = parseInt(item.stock_info_v2?.summary_info?.total_available_stock) || 0;
          
          const sku = item.item_sku || String(item.item_id);
          
          if (price > 0) pricesFound++;
          else pricesNotFound++;
          
          // Update if API returns valid price (> 0)
          if (price > 0) {
            const { error } = await supabase.from('products').upsert({
              sku: sku,
              shopee_price: price,
              shopee_stock: stock,
              last_sync: new Date().toISOString()
            }, { onConflict: 'sku' });
            
            if (!error) totalSaved++;
          }
        }
      }
      
      console.log('  ✅ Updated ' + items.length + ' items');
    } catch (e) {
      console.error('  ❌ Error: ' + e.message);
    }
  }
  
  console.log('\n✅ Sync complete! ' + totalSaved + ' products updated, ' + pricesFound + ' with price, ' + pricesNotFound + ' without price');
  process.exit(0);
}

syncFromShopee();