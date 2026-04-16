const pool = require('./config/db');
pool.query("SELECT id, name, image_url FROM categories")
  .then(r => { console.log('Categories:'); r.rows.forEach(x => console.log(x.id, x.name, x.image_url)); process.exit(); })
  .catch(e => { console.log(e.message); process.exit(); });
