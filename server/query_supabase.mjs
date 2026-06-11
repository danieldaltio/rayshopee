import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const { data } = await supabase.from('products').select('item_id, GTIN_EAN_BarCode, name').order('last_sync', { ascending: false }).limit(20);
console.log(JSON.stringify(data, null, 2));
