import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const { data } = await supabase.from('products').select('model_id, cost, GTIN_EAN_BarCode').eq('item_id', 23492840483);
console.log(JSON.stringify(data, null, 2));
