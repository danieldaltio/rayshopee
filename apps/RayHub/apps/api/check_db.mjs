import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: 'postgresql://rayshopee:rayshopee123@localhost:5432/rayshopee'
});

const client = await pool.connect();

// Check distinct order statuses
const statuses = await client.query('SELECT DISTINCT status, shopee_status FROM "Order" ORDER BY status');
console.log('=== Order Statuses ===');
statuses.rows.forEach(r => console.log(`  status: "${r.status}" | shopee_status: "${r.shopee_status}"`));

// Check date range
const dateRange = await client.query('SELECT MIN(data_pedido), MAX(data_pedido), COUNT(*) FROM "Order"');
console.log('\n=== Date Range ===', dateRange.rows[0]);

// Check orders from today
const today = new Date();
today.setHours(0,0,0,0);
const ordersToday = await client.query(`SELECT COUNT(*), SUM(total) FROM "Order" WHERE data_pedido >= $1`, [today]);
console.log('\n=== Orders Today ===', ordersToday.rows[0]);

// Check orders this month
const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
const ordersMonth = await client.query(`SELECT COUNT(*), SUM(total) FROM "Order" WHERE data_pedido >= $1`, [startOfMonth]);
console.log('\n=== Orders This Month ===', ordersMonth.rows[0]);

// Check invoices
const invoices = await client.query('SELECT COUNT(*), MIN(created_at), MAX(created_at) FROM "Invoice"');
console.log('\n=== Invoices ===', invoices.rows[0]);

client.release();
await pool.end();
