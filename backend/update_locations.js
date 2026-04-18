const pool = require('./config/db');

async function updateLocations() {
  try {
    // Update delivery partner location to Trichy (near store)
    await pool.query(`
      UPDATE users 
      SET latitude = '10.7905', longitude = '78.7041'
      WHERE role = 'delivery'
    `);
    console.log('Delivery partner location updated to Trichy (store area)');

    // Get user ID
    const user = await pool.query("SELECT id FROM users WHERE role = 'user'");
    if (user.rows.length > 0) {
      // Update user's last location (in Chennai)
      await pool.query(`
        UPDATE users 
        SET latitude = '13.0500', longitude = '80.2100'
        WHERE role = 'user'
      `);
      console.log('User location updated to Chennai');
    }

    console.log('\nUpdated locations:');
    const result = await pool.query('SELECT id, name, role, latitude, longitude FROM users');
    result.rows.forEach(u => {
      console.log(`  ${u.name} (${u.role}): ${u.latitude}, ${u.longitude}`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit();
  }
}

updateLocations();
