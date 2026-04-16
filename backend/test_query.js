const pool = require('./config/db');

pool.query(`
  SELECT 
    u.id, u.name, u.email, u.phone, u.is_online,
    COALESCE(pp.rating, 0) as rating,
    COALESCE(pp.completed_orders, 
      (SELECT COUNT(*)::int FROM orders WHERE delivery_partner_id = u.id AND status = 'delivered')
    ) as completed_orders,
    COALESCE(pp.total_earnings, 
      (SELECT COALESCE(SUM(partner_earnings), 0)::numeric FROM orders WHERE delivery_partner_id = u.id AND status = 'delivered')
    ) as total_earnings
  FROM users u
  LEFT JOIN partner_performance pp ON u.id = pp.partner_id
  WHERE u.role = 'delivery'
  ORDER BY u.name
`).then(r => {
  console.log('Result:', r.rows);
}).catch(e => console.error(e)).finally(() => pool.end());