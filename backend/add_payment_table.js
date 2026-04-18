const pool = require('./config/db');

async function addPaymentTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        user_id INTEGER REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        transaction_id VARCHAR(100),
        gateway_response TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ payment_transactions table created');

    // Add indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_order ON payment_transactions(order_id)
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_user ON payment_transactions(user_id)
    `);
    console.log('✅ Indexes created');

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    process.exit();
  }
}

addPaymentTable();
