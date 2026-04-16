const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixPermissions() {
  try {
    // Grant usage on all sequences
    await pool.query(`
      GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO selva123;
      GRANT INSERT, UPDATE, DELETE, SELECT ON ALL TABLES IN SCHEMA public TO selva123;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO selva123;
    `);
    console.log('✅ Permissions fixed!');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

fixPermissions();