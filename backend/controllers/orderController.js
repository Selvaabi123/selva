const pool = require('../config/db');
const crypto = require('crypto');
const logger = require('../utils/logger');

const generateOTP = () => {
  return crypto.randomInt(1000, 9999).toString();
};

const calculateDeliveryFee = (distanceKm) => {
  return 50;
};

const MAX_COD_ORDERS_PER_DAY = 5;
const COD_ORDER_WINDOW_HOURS = 24;

const checkCODSpam = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM orders 
      WHERE user_id = $1 
        AND payment_method = 'cod' 
        AND payment_status = 'pending'
        AND created_at > NOW() - INTERVAL '${COD_ORDER_WINDOW_HOURS} hours'
    `, [userId]);
    return parseInt(result.rows[0].count);
  } catch {
    return 0;
  }
};

const placeOrder = async (req, res) => {
  let { delivery_address, notes, payment_method = 'cod', latitude, longitude } = req.body;
  
  const allowedPaymentMethods = ['cod', 'online'];
  if (!allowedPaymentMethods.includes(payment_method)) {
    return res.status(400).json({ success: false, message: 'Invalid payment method' });
  }
  
  if (delivery_address) delivery_address = String(delivery_address).slice(0, 500).trim();
  if (notes) notes = String(notes).slice(0, 250).trim();
  
  if (latitude !== null && latitude !== undefined) {
    if (isNaN(latitude) || latitude < -90 || latitude > 90) {
      latitude = null;
    }
  }
  if (longitude !== null && longitude !== undefined) {
    if (isNaN(longitude) || longitude < -180 || longitude > 180) {
      longitude = null;
    }
  }
  
  logger.info('Order placement initiated', { userId: req.user?.id });

  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: 'Unauthorized - please login' });
  }

  if (payment_method === 'cod') {
    const recentCODOrders = await checkCODSpam(req.user.id);
    if (recentCODOrders >= MAX_COD_ORDERS_PER_DAY) {
      logger.warn('COD spam detected', { userId: req.user.id, recentOrders: recentCODOrders });
      return res.status(429).json({ 
        success: false, 
        message: `You have reached the maximum limit of ${MAX_COD_ORDERS_PER_DAY} Cash on Delivery orders in ${COD_ORDER_WINDOW_HOURS} hours. Please use online payment for your next order.`
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (latitude && longitude) {
      await client.query(
        'UPDATE users SET latitude = $1, longitude = $2 WHERE id = $3',
        [latitude, longitude, req.user.id]
      );
    }

    let cartResult = await client.query('SELECT id FROM cart WHERE user_id = $1', [req.user.id]);
    let cartId;
    if (cartResult.rows.length === 0) {
      const newCart = await client.query(
        'INSERT INTO cart (user_id) VALUES ($1) RETURNING id',
        [req.user.id]
      );
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartResult.rows[0].id;
    }

    const items = await client.query(
      `SELECT ci.product_id, ci.quantity, p.price, p.stock, p.name
       FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.cart_id = $1`,
      [cartId]
    );

    if (items.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Your cart is empty. Please add items before placing an order.' });
    }

    for (const item of items.rows) {
      const qty = parseInt(item.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 100) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, message: 'Invalid quantity for one or more items' });
      }
      if (item.stock < qty) {
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
    }
    
    const partnerEarnings = deliveryFee;
    const companyEarnings = subtotal;
    const total = subtotal + deliveryFee;
    const otp = generateOTP();

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_price, subtotal, delivery_fee, partner_earnings, company_earnings, status, delivery_address, notes, payment_status, delivery_latitude, delivery_longitude, delivery_otp)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12) RETURNING *`,
      [req.user.id, total.toFixed(2), subtotal.toFixed(2), deliveryFee, partnerEarnings, companyEarnings, delivery_address || null, notes || null, payment_status, latitude || null, longitude || null, otp]
    );
    const order = orderResult.rows[0];
    order.otp = otp;

    for (const item of items.rows) {
      await client.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)',
        [order.id, item.product_id, item.quantity, item.price]
      );
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    await client.query('COMMIT');
    logger.info('Order placed successfully', { orderId: order.id, userId: req.user.id });
    res.status(201).json({ success: true, order, message: 'Order placed successfully!' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error('Order placement failed', { error: err.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  } finally {
    client.release();
  }
};

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
    logger.error('Failed to fetch user orders', { error: err.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

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
    logger.error('Failed to fetch all orders', { error: err.message });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

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
    logger.info('Order status updated', { orderId: req.params.id, status });
    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    logger.error('Failed to update order status', { error: err.message, orderId: req.params.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

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
    if (req.user.role === 'user' && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, order });
  } catch (err) {
    logger.error('Failed to fetch order', { error: err.message, orderId: req.params.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

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
    logger.error('Failed to fetch analytics', { error: err.message });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

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

    logger.info('Order rated', { orderId, rating, userId: req.user.id });
    res.json({ success: true, message: 'Rating submitted successfully' });
  } catch (err) {
    logger.error('Failed to submit rating', { error: err.message, orderId });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

module.exports = { placeOrder, getUserOrders, getAllOrders, updateOrderStatus, getOrderById, getAnalytics, rateDelivery };
