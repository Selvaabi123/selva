const pool = require('./config/db');

async function updateImage() {
  try {
    await pool.query("UPDATE products SET image_url = 'https://picsum.photos/seed/product1/200' WHERE id = 1");
    console.log('✅ Image URL updated to picsum.photos');
    
    const result = await pool.query('SELECT id, name, image_url FROM products');
    console.log('Products:', JSON.stringify(result.rows, null, 2));
  } catch (e) {
    console.error(e.message);
  } finally {
    process.exit();
  }
}

updateImage();
