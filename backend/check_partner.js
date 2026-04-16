const pool = require('./config/db');

async function check() {
  const client = await pool.connect();
  try {
    // Check partner_performance table
    const perf = await client.query('SELECT * FROM partner_performance');
    console.log('partner_performance:', perf.rows);

    // Check orders for delivery partner 5
    const orders = await client.query(`
      SELECT id, status, delivery_partner_id, partner_earnings 
      FROM orders 
      WHERE delivery_partner_id = 5
    `);
    console.log('Orders for partner 5:', orders.rows);

    // Count delivered
    const delivered = await client.query(`
      SELECT COUNT(*) as count, SUM(partner_earnings) as earnings
      FROM orders 
      WHERE delivery_partner_id = 5 AND status = 'delivered'
    `);
    console.log('Delivered stats:', delivered.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

check();