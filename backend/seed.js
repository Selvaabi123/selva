const pool = require('./config/db');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await pool.connect();
  
  try {
    console.log('Seeding users...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Check if admin exists
    const adminCheck = await client.query("SELECT id FROM users WHERE email = 'admin@grocymart.com'");
    
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, password, role, phone, address) VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Admin User', 'admin@grocymart.com', hashedPassword, 'admin', '9876543210', 'Admin Office']
      );
      console.log('Admin user created');
    }
    
    // Check if delivery exists
    const deliveryCheck = await client.query("SELECT id FROM users WHERE email = 'delivery@grocymart.com'");
    
    if (deliveryCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, password, role, phone, address) VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Delivery Partner', 'delivery@grocymart.com', hashedPassword, 'delivery', '9876543211', 'Delivery Center']
      );
      console.log('Delivery user created');
    }
    
    // Check if user exists
    const userCheck = await client.query("SELECT id FROM users WHERE email = 'user@test.com'");
    
    if (userCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (name, email, password, role, phone, address) VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Test User', 'user@test.com', hashedPassword, 'user', '9876543212', '123 Main Street']
      );
      console.log('Test user created');
    }
    
    console.log('\n✅ Seed completed!\n');
    console.log('Login credentials:');
    console.log('------------------');
    console.log('Admin:    admin@grocymart.com    / password123');
    console.log('Delivery: delivery@grocymart.com / password123');
    console.log('User:     user@test.com          / password123');
    
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
