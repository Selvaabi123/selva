const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  pool.query("SET search_path = public");
});

async function test() {
  try {
    const result = await pool.query('SELECT * FROM users LIMIT 1');
    console.log('Success:', result.rows);
  } catch(e) {
    console.log('Error:', e.message);
  } finally {
    await pool.end();
  }
}

test();