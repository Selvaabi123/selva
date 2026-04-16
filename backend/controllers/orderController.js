const pool = require('../config/db');

const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

const calculateDeliveryFee = (distanceKm) => {
  return 50;
};

// POST /api/orders (user places order)
const placeOrder = async (req, res) => {
  let { delivery_address, notes, payment_method = 'cod', latitude, longitude } = req.body;
  
  // SECURITY: Sanitize inputs to prevent XSS and injection
  if (delivery_address) delivery_address = String(delivery_address).slice(0, 500).trim();
  if (notes) notes = String(notes).slice(0, 250).trim();
  if (payment_method) payment_method = ['cod', 'online'].includes(payment_method) ? payment_method : 'cod';
  
  // Validate latitude/longitude if provided
  if (latitude && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
    latitude = null;
  }
  if (longitude && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
    longitude = null;
  }
  
  console.log('placeOrder request:', { userId: req.user?.id, body: req.body });
  console.log('User Location:', { latitude, longitude, delivery_address });

  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: 'Unauthorized - please login' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Checking cart for user:', req.user.id);

    // Get user's cart - ensure cart exists
    let cartResult = await client.query('SELECT id FROM cart WHERE user_id = $1', [req.user.id]);
    console.log('Cart result:', cartResult.rows);
    
    // Create cart if doesn't exist
    let cartId;
    if (cartResult.rows.length === 0) {
      console.log('Creating new cart for user');
      const newCart = await client.query(
        'INSERT INTO cart (user_id) VALUES ($1) RETURNING id',
        [req.user.id]
      );
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartResult.rows[0].id;
    }

    console.log('Using cartId:', cartId);

    const items = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
       FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1`,
      [cartId]
    );

    console.log('Cart items:', items.rows.length);

    if (items.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items before placing an order.' });
    }

    // Check stock
    for (const item of items.rows) {
      if (item.stock < item.quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: `Insufficient stock for ${item.name}` });
      }
    }

    const subtotal = items.rows.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    const payment_status = payment_method === 'online' ? 'paid' : 'pending';
    
    const STORE_LAT = 10.7905;
    const STORE_LON = 78.7041;
    let deliveryFee = 0;
    if (latitude && longitude) {
      const R = 6371;
      const dLat = (parseFloat(latitude) - STORE_LAT) * Math.PI / 180;
      const dLon = (parseFloat(longitude) - STORE_LON) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(STORE_LAT * Math.PI / 180) * Math.cos(parseFloat(latitude) * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      deliveryFee = calculateDeliveryFee(distance);
      console.log('Distance:', distance.toFixed(2), 'km, Delivery Fee:', deliveryFee);
    }
    
    const partnerEarnings = deliveryFee;
    const companyEarnings = subtotal;
    const total = subtotal + deliveryFee;
    const otp = generateOTP();
    console.log('Creating order with subtotal:', subtotal, 'deliveryFee:', deliveryFee, 'total:', total, 'OTP:', otp);

    // Create order
    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_price, subtotal, delivery_fee, partner_earnings, company_earnings, status, delivery_address, notes, payment_status, delivery_latitude, delivery_longitude, delivery_otp)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.user.id, total.toFixed(2), subtotal.toFixed(2), deliveryFee, partnerEarnings, companyEarnings, delivery_address || null, notes || null, payment_status, latitude || null, longitude || null, otp]
    );
    const order = orderResult.rows[0];
    order.otp = otp;
    console.log('Order created:', order.id, 'OTP:', otp);

    // Create order items & update stock
    for (const item of items.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)',
        [order.id, item.product_id, item.quantity, item.price]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    // Clear cart
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');
    console.log('Order placed successfully:', order.id);
    res.status(201).json({ success: true, order, message: 'Order placed successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Order error:', err);
    res.status(500).json({ success: false, message: 'Failed to place order: ' + err.message });
  } finally {
    client.release();
  }
};

// GET /api/orders/user (user's own orders)
const getUserOrders = async (req, res) => {
  try {
    const orders = await pool.query(
      `SELECT o.*, 
       COALESCE(
         json_agg(json_build_object('product_id', oi.product_id, 'name', p.name, 'quantity', oi.quantity, 'price', oi.price, 'image_url', p.image_url)) FILTER (WHERE oi.id IS NOT NULL),
         '[]'::json
       ) AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE o.user_id = $1
       GROUP BY o.id ORDER BY o.created_at DESC`,
      [req.user.id]
    );
    res.json({ success: true, orders: orders.rows });
  } catch (err) {
    console.error('getUserOrders error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// GET /api/orders (admin - all orders)
const getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let whereClause = '';
  const params = [];

  if (status) {
    whereClause = 'WHERE o.status = $1';
    params.push(status);
  }

  try {
    const result = await pool.query(
      `SELECT o.*, 
       u.name AS customer_name, u.email AS customer_email, u.phone AS customer_phone,
       dp.name AS delivery_partner_name,
       COALESCE(
         json_agg(json_build_object('product_id', oi.product_id, 'name', p.name, 'quantity', oi.quantity, 'price', oi.price)) FILTER (WHERE oi.id IS NOT NULL),
         '[]'::json
       ) AS items
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users dp ON o.delivery_partner_id = dp.id
       LEFT JOIN order_items oi ON o.id = oi.order_id
       LEFT JOIN products p ON oi.product_id = p.id
       ${whereClause}
       GROUP BY o.id, u.name, u.email, u.phone, dp.name
       ORDER BY o.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );
    const countResult = await pool.query(`SELECT COUNT(*) FROM orders o ${whereClause}`, params);
    res.json({ success: true, orders: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/orders/:id/status (admin)
const updateOrderStatus = async (req, res) => {
  const { status, delivery_partner_id } = req.body;
  const validStatuses = ['pending','confirmed','preparing','picked','out_for_delivery','delivered','cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  try {
    let query, params;
    if (delivery_partner_id) {
      query = 'UPDATE orders SET status=$1, delivery_partner_id=$2 WHERE id=$3 RETURNING *';
      params = [status, delivery_partner_id, req.params.id];
    } else {
      query = 'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *';
      params = [status, req.params.id];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/orders/:id (single order detail)
const getOrderById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.*, 
      u.name AS customer_name, u.phone AS customer_phone,
      u.latitude AS customer_latitude, u.longitude AS customer_longitude,
      dp.name AS delivery_partner_name, dp.phone AS delivery_partner_phone,
      dp.latitude AS delivery_latitude, dp.longitude AS delivery_longitude,
      json_agg(json_build_object('product_id', oi.product_id, 'name', p.name, 'quantity', oi.quantity, 'price', oi.price, 'image_url', p.image_url)) AS items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users dp ON o.delivery_partner_id = dp.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.id = $1
      GROUP BY o.id, u.name, u.phone, u.latitude, u.longitude, dp.name, dp.phone, dp.latitude, dp.longitude`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Order not found' });

    const order = result.rows[0];
    // Only allow user to see their own order, or admin/delivery
    if (req.user.role === 'user' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [totalOrders, totalRevenue, totalUsers, totalProducts, recentOrders, ordersByStatus] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM orders'),
      pool.query("SELECT COALESCE(SUM(total_price), 0) AS revenue FROM orders WHERE status = 'delivered'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'user'"),
      pool.query('SELECT COUNT(*) FROM products'),
      pool.query(`SELECT o.id, o.total_price, o.status, o.created_at, u.name AS customer FROM orders o 
                  LEFT JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC LIMIT 5`),
      pool.query('SELECT status, COUNT(*) FROM orders GROUP BY status'),
    ]);

    res.json({
      success: true,
      analytics: {
        totalOrders: parseInt(totalOrders.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].revenue),
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalProducts: parseInt(totalProducts.rows[0].count),
        recentOrders: recentOrders.rows,
        ordersByStatus: ordersByStatus.rows,
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/orders/:id/rate - Customer rates a delivered order
const rateDelivery = async (req, res) => {
  const { rating, feedback } = req.body;
  const orderId = req.params.id;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  try {
    const order = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, req.user.id]
    );

    if (order.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.rows[0].status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Can only rate delivered orders' });
    }

    if (order.rows[0].customer_rating) {
      return res.status(400).json({ success: false, message: 'Already rated this order' });
    }

    await pool.query(
      'UPDATE orders SET customer_rating = $1 WHERE id = $2',
      [rating, orderId]
    );

    if (order.rows[0].delivery_partner_id) {
      await pool.query(`
        UPDATE partner_performance 
        SET 
          total_ratings = total_ratings + 1,
          rating = (rating * total_ratings + $1) / (total_ratings + 1)
        WHERE partner_id = $2
      `, [rating, order.rows[0].delivery_partner_id]);
    }

    res.json({ success: true, message: 'Rating submitted successfully' });
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { placeOrder, getUserOrders, getAllOrders, updateOrderStatus, getOrderById, getAnalytics, rateDelivery };
