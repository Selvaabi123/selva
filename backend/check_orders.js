const pool = require('./config/db');

pool.query('SELECT id, name, email, role FROM users WHERE role = $1', ['delivery'])
  .then(r => {
    console.log('Delivery partners:', r.rows);
    return pool.query('SELECT id, status, delivery_partner_id, total_price, partner_earnings FROM orders ORDER BY id DESC');
  })
  .then(r => {
    console.log('Orders:', r.rows);
  })
  .catch(e => console.error(e))
  .finally(() => pool.end());