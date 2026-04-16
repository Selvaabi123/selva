const pool = require('../config/db');

// ============================================================
// HELPER: Generate 4-digit OTP
// ============================================================
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

// ============================================================
// GET /api/delivery/orders
// ============================================================
const getAssignedOrders = async (req, res) => {
  console.log('getAssignedOrders called for user:', req.user.id, req.user.email);
  try {
    console.log('Query: delivery_partner_id =', req.user.id);
    
    const result = await pool.query(`
      SELECT 
        o.*,
        u.name AS customer_name, 
        u.phone AS customer_phone,
        u.email AS customer_email,
        c.name AS category_name,
        c.latitude AS shop_latitude,
        c.longitude AS shop_longitude,
        c.address AS shop_address,
        COALESCE(
          (
            SELECT JSON_AGG(
              JSON_BUILD_OBJECT(
                'name', p.name, 
                'quantity', oi.quantity, 
                'price', oi.price
              )
            )::jsonb
            FROM order_items oi
            LEFT JOIN products p ON oi.product_id = p.id
            WHERE oi.order_id = o.id
          ),
          '[]'::jsonb
        ) AS items
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN categories c ON c.id = 1
      WHERE o.delivery_partner_id = $1
        AND o.status NOT IN ('delivered', 'cancelled', 'returned')
      ORDER BY 
        CASE o.status 
          WHEN 'ready_for_pickup' THEN 1 
          WHEN 'assigned' THEN 2 
          WHEN 'arrived_at_store' THEN 3 
          WHEN 'picked' THEN 4 
          WHEN 'out_for_delivery' THEN 5 
          WHEN 'arrived_at_door' THEN 6 
          ELSE 7 
        END,
        o.created_at DESC
    `, [req.user.id]);

    console.log('Orders found:', result.rows.length);
    console.log('Order statuses:', result.rows.map(o => o.status));
    
    res.json({ success: true, orders: result.rows });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================
// GET /api/delivery/order/:id
// ============================================================
const getOrderById = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        u.name AS customer_name, 
        u.phone AS customer_phone,
        u.email AS customer_email
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.id = $1 AND o.delivery_partner_id = $2
    `, [req.params.id, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================
// PUT /api/delivery/toggle-online
// ============================================================
const toggleOnlineStatus = async (req, res) => {
  const { is_online } = req.body;
  const { latitude, longitude } = req.body;

  console.log('toggle-online called:', { user: req.user, is_online, latitude, longitude });

  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No user found' });
  }

  try {
    const result = await pool.query(`
      UPDATE users 
      SET is_online = $1, 
          latitude = COALESCE($2, latitude), 
          longitude = COALESCE($3, longitude)
      WHERE id = $4
      RETURNING id, name, email, role, is_online, latitude, longitude
    `, [is_online, latitude, longitude, req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    console.log('Update successful:', result.rows[0]);

    res.json({ 
      success: true, 
      user: result.rows[0],
      message: is_online ? 'You are now online!' : 'You are now offline'
    });
  } catch (err) {
    console.error('toggle-online error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// ============================================================
// PUT /api/delivery/update-location
// ============================================================
const updateLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ success: false, message: 'Latitude and longitude required' });
  }

  try {
    await pool.query(`
      UPDATE users 
      SET latitude = $1, longitude = $2, last_location_update = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [latitude, longitude, req.user.id]);

    // Log location update
    await pool.query(`
      INSERT INTO delivery_logs (partner_id, location_lat, location_lng)
      VALUES ($1, $2, $3)
    `, [req.user.id, latitude, longitude]);

    res.json({ success: true, message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================
// PUT /api/delivery/update-status
// ============================================================
const updateDeliveryStatus = async (req, res) => {
  const { order_id, status, latitude, longitude } = req.body;
  
  const allowedStatuses = [
    'arrived_at_store',
    'picked', 
    'out_for_delivery',
    'arrived_at_door',
    'delivered'
  ];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid status' 
    });
  }

  try {
    // Verify order belongs to this partner
    const orderCheck = await pool.query(
      'SELECT * FROM orders WHERE id = $1 AND delivery_partner_id = $2',
      [order_id, req.user.id]
    );

    if (orderCheck.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Order not assigned to you' });
    }

    const order = orderCheck.rows[0];
    let updateData = { status };
    let otp = null;

    // Generate OTP when going out for delivery
    if (status === 'out_for_delivery' && order.status !== 'out_for_delivery') {
      otp = generateOTP();
      updateData.delivery_otp = otp;
      updateData.delivery_started_at = new Date();
    }

    // Set timestamps based on status
    if (status === 'arrived_at_store') {
      updateData.arrived_at_store_at = new Date();
    } else if (status === 'picked') {
      updateData.picked_at = new Date();
    } else if (status === 'delivered') {
      updateData.delivered_at = new Date();
      updateData.payment_status = 'paid';
    }

    // Update order
    const setClause = Object.keys(updateData)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(', ');
    
    const values = [...Object.values(updateData), order_id];
    
    const result = await pool.query(
      `UPDATE orders SET ${setClause} WHERE id = $${values.length} RETURNING *`,
      values
    );

    // Log status change
    await pool.query(`
      INSERT INTO delivery_logs (order_id, partner_id, status, location_lat, location_lng)
      VALUES ($1, $2, $3, $4, $5)
    `, [order_id, req.user.id, status, latitude, longitude]);

    // If delivered, update partner earnings and performance
    if (status === 'delivered') {
      await pool.query(`
        UPDATE users 
        SET today_earnings = today_earnings + $1, 
            active_order_id = NULL
        WHERE id = $2
      `, [order.partner_earnings || 50, req.user.id]);

      await pool.query(`
        UPDATE partner_performance 
        SET completed_orders = completed_orders + 1,
            total_trips = total_trips + 1,
            total_earnings = total_earnings + $1,
            weekly_earnings = weekly_earnings + $1,
            monthly_earnings = monthly_earnings + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE partner_id = $2
      `, [order.partner_earnings || 50, req.user.id]);
    }

    // Log delivery completed
    await pool.query(`
      INSERT INTO delivery_logs (order_id, partner_id, status)
      VALUES ($1, $2, $3)
    `, [order_id, req.user.id, status]);

    res.json({ 
      success: true, 
      order: result.rows[0],
      otp: otp,
      message: `Status updated to ${status.replace(/_/g, ' ')}`
    });
  } catch (err) {
    console.error('Status update error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================
// POST /api/delivery/verify-otp
// ============================================================
const verifyOTP = async (req, res) => {
  const { order_id, otp } = req.body;

  console.log('verifyOTP called:', { order_id, otp, user: req.user?.id });

  // Validate authentication
  if (!req.user || !req.user.id) {
    console.error('User not authenticated - req.user:', req.user);
    return res.status(401).json({ success: false, message: 'User not authenticated' });
  }

  // Validate required fields
  if (!order_id) {
    return res.status(400).json({ success: false, message: 'Order ID is required' });
  }

  if (!otp) {
    return res.status(400).json({ success: false, message: 'OTP is required' });
  }

  // Validate OTP format (must be 4 digits)
  if (!/^\d{4}$/.test(otp)) {
    console.log('Invalid OTP format:', otp);
    return res.status(400).json({ success: false, message: 'OTP must be 4 digits' });
  }

  try {
    // Check if order exists and is assigned to this delivery partner
    const orderCheck = await pool.query(
      `SELECT id, status, delivery_otp, delivery_partner_id 
       FROM orders 
       WHERE id = $1 AND delivery_partner_id = $2`,
      [order_id, req.user.id]
    );

    if (orderCheck.rows.length === 0) {
      console.log('Order not found or not assigned to this partner. Order ID:', order_id, 'User ID:', req.user.id);
      return res.status(404).json({ 
        success: false, 
        message: 'Order not found or not assigned to you' 
      });
    }

    const order = orderCheck.rows[0];

    // Check if order is in deliverable status
    const allowedStatuses = ['out_for_delivery', 'arrived_at_door'];
    if (!allowedStatuses.includes(order.status)) {
      console.log('Order status not eligible for OTP verification:', order.status);
      return res.status(400).json({ 
        success: false, 
        message: 'Order is not ready for delivery verification' 
      });
    }

    // Check if OTP exists in database
    if (!order.delivery_otp) {
      console.log('No OTP generated for this order');
      return res.status(400).json({ 
        success: false, 
        message: 'OTP not available for this order. Please contact support.' 
      });
    }

    // Verify OTP
    console.log('Comparing OTP:', { db: order.delivery_otp, entered: otp, match: order.delivery_otp === otp });
    
    if (String(order.delivery_otp) !== String(otp)) {
      console.log('OTP mismatch');
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP. Please try again.',
        verified: false 
      });
    }

    // OTP verified - update order to delivered
    const updateResult = await pool.query(
      `UPDATE orders 
       SET status = 'delivered', 
           delivered_at = CURRENT_TIMESTAMP,
           payment_status = 'paid'
       WHERE id = $1
       RETURNING *`,
      [order_id]
    );

    console.log('Order updated to delivered:', updateResult.rows[0]?.id);

    // Update delivery partner performance
    try {
      const orderData = order; // from earlier query
      const earningsToAdd = orderData?.partner_earnings || orderData?.delivery_fee || 0;
      await pool.query(
        `UPDATE partner_performance 
         SET completed_orders = completed_orders + 1,
             total_trips = total_trips + 1,
             total_earnings = total_earnings + $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE partner_id = $1`,
        [req.user.id, earningsToAdd]
      );
      console.log('Partner performance updated with earnings:', earningsToAdd);
    } catch (perfErr) {
      console.error('Error updating partner performance:', perfErr.message);
    }

    res.json({ 
      success: true, 
      message: 'Delivery confirmed! OTP verified successfully.',
      verified: true,
      order: updateResult.rows[0]
    });
  } catch (err) {
    console.error('verifyOTP error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error. Please try again later.' 
    });
  }
};

// ============================================================
// GET /api/delivery/earnings
// ============================================================
const getEarnings = async (req, res) => {
  console.log('getEarnings called:', req.user);

  try {
    // Get today's earnings from partner_earnings field (not total_price)
    const todayResult = await pool.query(`
      SELECT 
        COALESCE(SUM(partner_earnings), 0) as earnings,
        COUNT(*) as deliveries
      FROM orders
      WHERE delivery_partner_id = $1 
        AND status = 'delivered'
        AND DATE(delivered_at) = CURRENT_DATE
    `, [req.user.id]);

    // Get daily earnings for last 7 days (use partner_earnings, not total_price)
    const dailyResult = await pool.query(`
      SELECT 
        DATE(delivered_at) as date,
        COUNT(*) as deliveries,
        COALESCE(SUM(partner_earnings), 0) as earnings
      FROM orders
      WHERE delivery_partner_id = $1 
        AND status = 'delivered'
        AND delivered_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(delivered_at)
      ORDER BY date DESC
    `, [req.user.id]);

    // Get weekly stats (use partner_earnings)
    const weeklyResult = await pool.query(`
      SELECT 
        COUNT(*) as deliveries,
        COALESCE(SUM(partner_earnings), 0) as earnings
      FROM orders
      WHERE delivery_partner_id = $1 
        AND status = 'delivered'
        AND delivered_at >= DATE_TRUNC('week', CURRENT_DATE)
    `, [req.user.id]);

    // Get monthly stats (use partner_earnings)
    const monthlyResult = await pool.query(`
      SELECT 
        COUNT(*) as deliveries,
        COALESCE(SUM(partner_earnings), 0) as earnings
      FROM orders
      WHERE delivery_partner_id = $1 
        AND status = 'delivered'
        AND delivered_at >= DATE_TRUNC('month', CURRENT_DATE)
    `, [req.user.id]);

    // Get partner performance stats
    const perfResult = await pool.query(
      'SELECT * FROM partner_performance WHERE partner_id = $1',
      [req.user.id]
    );

    // Get active orders count (assigned, picked, out_for_delivery)
    const activeResult = await pool.query(`
      SELECT COUNT(*) as count FROM orders
      WHERE delivery_partner_id = $1 
        AND status IN ('assigned', 'picked_up', 'out_for_delivery')
    `, [req.user.id]);

    res.json({
      success: true,
      today: {
        earnings: parseFloat(todayResult.rows[0]?.earnings) || 0,
        deliveries: parseInt(todayResult.rows[0]?.deliveries) || 0
      },
      weekly: {
        deliveries: parseInt(weeklyResult.rows[0]?.deliveries) || 0,
        earnings: parseFloat(weeklyResult.rows[0]?.earnings) || 0
      },
      monthly: {
        deliveries: parseInt(monthlyResult.rows[0]?.deliveries) || 0,
        earnings: parseFloat(monthlyResult.rows[0]?.earnings) || 0
      },
      daily: dailyResult.rows.map(d => ({
        date: d.date,
        deliveries: parseInt(d.deliveries),
        earnings: parseFloat(d.earnings)
      })),
      activeOrders: parseInt(activeResult.rows[0]?.count) || 0,
      performance: perfResult.rows[0] || {}
    });
  } catch (err) {
    console.error('getEarnings error:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
};

// ============================================================
// GET /api/delivery/history
// ============================================================
const getOrderHistory = async (req, res) => {
  console.log('getOrderHistory called for user:', req.user.id);
  const { page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(`
      SELECT 
        o.*,
        u.name AS customer_name,
        u.phone AS customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.delivery_partner_id = $1 
        AND o.status IN ('delivered', 'cancelled', 'returned')
      ORDER BY o.created_at DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);

    console.log('History orders found:', result.rows.length);
    console.log('History statuses:', result.rows.map(o => o.status));

    const countResult = await pool.query(`
      SELECT COUNT(*) FROM orders 
      WHERE delivery_partner_id = $1 AND status IN ('delivered', 'cancelled', 'returned')
    `, [req.user.id]);

    res.json({
      success: true,
      orders: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      pages: Math.ceil(countResult.rows[0].count / limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================
// POST /api/delivery/report-issue
// ============================================================
const reportIssue = async (req, res) => {
  const { order_id, issue_type, description } = req.body;

  const validTypes = [
    'customer_not_available',
    'wrong_address',
    'address_unreachable',
    'customer_refused',
    'food_spilled',
    'traffic_delay',
    'vehicle_issue',
    'store_delay',
    'order_wrong',
    'other'
  ];

  if (!validTypes.includes(issue_type)) {
    return res.status(400).json({ success: false, message: 'Invalid issue type' });
  }

  try {
    const result = await pool.query(`
      INSERT INTO order_issues (order_id, reported_by, issue_type, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [order_id, req.user.id, issue_type, description]);

    res.json({ 
      success: true, 
      issue: result.rows[0],
      message: 'Issue reported successfully' 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================
// GET /api/delivery/profile
// ============================================================
const getProfile = async (req, res) => {
  try {
    const userResult = await pool.query(`
      SELECT id, name, email, phone, is_online, latitude, longitude,
             today_earnings, active_order_id
      FROM users WHERE id = $1
    `, [req.user.id]);

    const perfResult = await pool.query(
      'SELECT * FROM partner_performance WHERE partner_id = $1',
      [req.user.id]
    );

    res.json({
      success: true,
      profile: userResult.rows[0],
      performance: perfResult.rows[0] || {}
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================
// GET /api/delivery/partners (Admin)
// ============================================================
const getDeliveryPartners = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, u.name, u.email, u.phone, u.is_online, u.latitude, u.longitude,
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
    `);
    res.json({ success: true, partners: result.rows });
  } catch (err) {
    console.error('getDeliveryPartners error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ============================================================
// EXPORTS
// ============================================================
module.exports = {
  getAssignedOrders,
  getOrderById,
  toggleOnlineStatus,
  updateLocation,
  updateDeliveryStatus,
  verifyOTP,
  getEarnings,
  getOrderHistory,
  reportIssue,
  getProfile,
  getDeliveryPartners
};
