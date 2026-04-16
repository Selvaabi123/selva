const pool = require('./config/db');

async function migrate() {
  const client = await pool.connect();
  
  try {
    console.log('Running migration...');
    
    // Check if columns exist and add if not
    const ordersTable = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    
    const columns = ordersTable.rows.map(r => r.column_name);
    console.log('Existing columns:', columns);
    
    if (!columns.includes('delivery_otp')) {
      await client.query(`ALTER TABLE orders ADD COLUMN delivery_otp VARCHAR(4)`);
      console.log('Added delivery_otp column');
    }
    
    if (!columns.includes('delivery_fee')) {
      await client.query(`ALTER TABLE orders ADD COLUMN delivery_fee DECIMAL(10,2) DEFAULT 0`);
      console.log('Added delivery_fee column');
    }
    
    if (!columns.includes('partner_earnings')) {
      await client.query(`ALTER TABLE orders ADD COLUMN partner_earnings DECIMAL(10,2) DEFAULT 0`);
      console.log('Added partner_earnings column');
    }
    
    if (!columns.includes('company_earnings')) {
      await client.query(`ALTER TABLE orders ADD COLUMN company_earnings DECIMAL(10,2) DEFAULT 0`);
      console.log('Added company_earnings column');
    }
    
    if (!columns.includes('subtotal')) {
      await client.query(`ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0`);
      console.log('Added subtotal column');
    }
    
    if (!columns.includes('delivered_at')) {
      await client.query(`ALTER TABLE orders ADD COLUMN delivered_at TIMESTAMP`);
      console.log('Added delivered_at column');
    }
    
    if (!columns.includes('delivery_started_at')) {
      await client.query(`ALTER TABLE orders ADD COLUMN delivery_started_at TIMESTAMP`);
      console.log('Added delivery_started_at column');
    }
    
    if (!columns.includes('arrived_at_store_at')) {
      await client.query(`ALTER TABLE orders ADD COLUMN arrived_at_store_at TIMESTAMP`);
      console.log('Added arrived_at_store_at column');
    }
    
    if (!columns.includes('picked_at')) {
      await client.query(`ALTER TABLE orders ADD COLUMN picked_at TIMESTAMP`);
      console.log('Added picked_at column');
    }
    
    console.log('Migration completed successfully!');
    
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
