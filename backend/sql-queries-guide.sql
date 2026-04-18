-- ==========================================
-- GROCY-MART SQL QUERIES GUIDE
-- Complete Reference for All Database Operations
-- ==========================================

-- ==========================================
-- PART 1: USERS QUERIES
-- ==========================================

-- [1.1] Get User by ID
SELECT id, name, email, role, phone, address, is_online, latitude, longitude, created_at
FROM users WHERE id = $1;

-- [1.2] Get User by Email
SELECT id, name, email, role, phone, password FROM users WHERE email = $1;

-- [1.3] Get All Users (Admin)
SELECT id, name, email, role, phone, is_online, created_at FROM users ORDER BY created_at DESC;

-- [1.4] Get Users by Role
SELECT id, name, email, phone, is_online FROM users WHERE role = $1;

-- [1.5] Get All Delivery Partners
SELECT u.id, u.name, u.email, u.phone, u.is_online, 
       pp.rating, pp.completed_orders, pp.total_earnings
FROM users u
LEFT JOIN partner_performance pp ON u.id = pp.partner_id
WHERE u.role = 'delivery'
ORDER BY u.name;

-- [1.6] Create User
INSERT INTO users (name, email, password, role, phone, address) 
VALUES ($1, $2, $3, $4, $5, $6) 
RETURNING id, name, email, role, phone;

-- [1.7] Update User
UPDATE users SET 
    name = COALESCE($2, name),
    phone = COALESCE($3, phone),
    address = COALESCE($4, address),
    latitude = COALESCE($5, latitude),
    longitude = COALESCE($6, longitude)
WHERE id = $1
RETURNING *;

-- [1.8] Update User Online Status
UPDATE users SET is_online = $2 WHERE id = $1;

-- [1.9] Update User Location
UPDATE users SET 
    latitude = $2, 
    longitude = $3, 
    last_location_update = CURRENT_TIMESTAMP
WHERE id = $1;

-- [1.10] Delete User
DELETE FROM users WHERE id = $1;

-- [1.11] Check Email Exists
SELECT EXISTS(SELECT 1 FROM users WHERE email = $1);

-- ==========================================
-- PART 2: CATEGORIES QUERIES
-- ==========================================

-- [2.1] Get All Categories
SELECT * FROM categories ORDER BY name;

-- [2.2] Get Category by ID
SELECT * FROM categories WHERE id = $1;

-- [2.3] Get Category with Products
SELECT c.*, 
       COALESCE(
           json_agg(
               json_build_object(
                   'id', p.id,
                   'name', p.name,
                   'price', p.price,
                   'stock', p.stock,
                   'is_available', p.is_available
               )
           ) FILTER (WHERE p.id IS NOT NULL),
           '[]'
       ) as products
FROM categories c
LEFT JOIN products p ON c.id = p.category_id
WHERE c.id = $1
GROUP BY c.id;

-- [2.4] Create Category
INSERT INTO categories (name, image_url, latitude, longitude, address)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- [2.5] Update Category
UPDATE categories SET 
    name = COALESCE($2, name),
    image_url = COALESCE($3, image_url),
    latitude = COALESCE($4, latitude),
    longitude = COALESCE($5, longitude),
    address = COALESCE($6, address)
WHERE id = $1
RETURNING *;

-- [2.6] Delete Category
DELETE FROM categories WHERE id = $1;

-- ==========================================
-- PART 3: PRODUCTS QUERIES
-- ==========================================

-- [3.1] Get All Products
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
ORDER BY c.name, p.name;

-- [3.2] Get Product by ID
SELECT p.*, c.name as category_name
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
WHERE p.id = $1;

-- [3.3] Get Products by Category
SELECT * FROM products WHERE category_id = $1 AND is_available = TRUE;

-- [3.4] Search Products
SELECT * FROM products 
WHERE name ILIKE '%' || $1 || '%' 
   OR description ILIKE '%' || $1 || '%';

-- [3.5] Get Available Products with Stock
SELECT * FROM products 
WHERE is_available = TRUE AND stock > 0
ORDER BY name;

-- [3.6] Create Product
INSERT INTO products (name, description, price, category_id, image_url, stock, is_available)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- [3.7] Update Product
UPDATE products SET 
    name = COALESCE($2, name),
    description = COALESCE($3, description),
    price = COALESCE($4, price),
    category_id = COALESCE($5, category_id),
    image_url = COALESCE($6, image_url),
    stock = COALESCE($7, stock),
    is_available = COALESCE($8, is_available)
WHERE id = $1
RETURNING *;

-- [3.8] Update Product Stock
UPDATE products SET stock = stock - $2 WHERE id = $1 AND stock >= $2;

-- [3.9] Delete Product
DELETE FROM products WHERE id = $1;

-- [3.10] Get Low Stock Products
SELECT * FROM products WHERE stock < 10 AND is_available = TRUE;

-- ==========================================
-- PART 4: CART QUERIES
-- ==========================================

-- [4.1] Get or Create Cart for User
INSERT INTO cart (user_id) VALUES ($1)
ON CONFLICT (user_id) DO UPDATE SET user_id = $1
RETURNING *;

-- [4.2] Get Cart Items with Products
SELECT ci.*, p.name, p.price, p.image_url, p.stock
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
JOIN cart c ON ci.cart_id = c.id
WHERE c.user_id = $1;

-- [4.3] Add Item to Cart
INSERT INTO cart_items (cart_id, product_id, quantity)
VALUES ($1, $2, $3)
ON CONFLICT (cart_id, product_id) 
DO UPDATE SET quantity = cart_items.quantity + $3;

-- [4.4] Update Cart Item Quantity
UPDATE cart_items SET quantity = $3 
WHERE cart_id = $1 AND product_id = $2;

-- [4.5] Remove Item from Cart
DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2;

-- [4.6] Clear Cart
DELETE FROM cart_items WHERE cart_id = $1;

-- [4.7] Get Cart Total
SELECT SUM(p.price * ci.quantity) as total
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.cart_id = $1;

-- [4.8] Get Cart Item Count
SELECT COUNT(*) as count FROM cart_items WHERE cart_id = $1;

-- ==========================================
-- PART 5: ORDERS QUERIES
-- ==========================================

-- [5.1] Get User Orders
SELECT o.*, 
       COALESCE(
           json_agg(
               json_build_object(
                   'product_id', oi.product_id,
                   'name', p.name,
                   'quantity', oi.quantity,
                   'price', oi.price,
                   'image_url', p.image_url
               )
           ) FILTER (WHERE oi.id IS NOT NULL),
           '[]'
       ) as items
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
WHERE o.user_id = $1
GROUP BY o.id
ORDER BY o.created_at DESC;

-- [5.2] Get Order by ID
SELECT o.*, 
       u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
       dp.name as delivery_partner_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN users dp ON o.delivery_partner_id = dp.id
WHERE o.id = $1;

-- [5.3] Get All Orders (Admin)
SELECT o.*, 
       u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
       dp.name as delivery_partner_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN users dp ON o.delivery_partner_id = dp.id
WHERE ($1::text IS NULL OR o.status = $1)
ORDER BY o.created_at DESC
LIMIT $2 OFFSET $3;

-- [5.4] Get Orders by Status
SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC;

-- [5.5] Get Orders by Delivery Partner
SELECT o.*, 
       u.name as customer_name, u.phone as customer_phone
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
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
    o.created_at DESC;

-- [5.6] Create Order
INSERT INTO orders (user_id, total_price, subtotal, delivery_fee, partner_earnings, 
                    company_earnings, status, delivery_address, notes, payment_status,
                    delivery_latitude, delivery_longitude, delivery_otp, payment_method)
VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13)
RETURNING *;

-- [5.7] Update Order Status
UPDATE orders SET 
    status = $2,
    arrived_at_store_at = CASE WHEN $2 = 'arrived_at_store' THEN CURRENT_TIMESTAMP ELSE arrived_at_store_at END,
    picked_at = CASE WHEN $2 = 'picked' THEN CURRENT_TIMESTAMP ELSE picked_at END,
    delivered_at = CASE WHEN $2 = 'delivered' THEN CURRENT_TIMESTAMP ELSE delivered_at END,
    delivery_started_at = CASE WHEN $2 = 'out_for_delivery' THEN CURRENT_TIMESTAMP ELSE delivery_started_at END,
    payment_status = CASE WHEN $2 = 'delivered' THEN 'paid' ELSE payment_status END
WHERE id = $1
RETURNING *;

-- [5.8] Assign Delivery Partner
UPDATE orders SET 
    delivery_partner_id = $2,
    status = 'assigned'
WHERE id = $1
RETURNING *;

-- [5.9] Cancel Order
UPDATE orders SET status = 'cancelled' WHERE id = $1 AND status IN ('pending', 'confirmed');

-- [5.10] Get Order Items
SELECT oi.*, p.name, p.image_url
FROM order_items oi
LEFT JOIN products p ON oi.product_id = p.id
WHERE oi.order_id = $1;

-- [5.11] Create Order Item
INSERT INTO order_items (order_id, product_id, quantity, price)
VALUES ($1, $2, $3, $4);

-- [5.12] Get Daily Orders Count
SELECT COUNT(*) FROM orders 
WHERE DATE(created_at) = CURRENT_DATE;

-- [5.13] Get Orders Revenue (Today)
SELECT COALESCE(SUM(total_price), 0) as revenue
FROM orders 
WHERE DATE(created_at) = CURRENT_DATE 
  AND payment_status = 'paid';

-- [5.14] Get COD Orders Count (Last 24 Hours) - SPAM PROTECTION
SELECT COUNT(*) as count FROM orders 
WHERE user_id = $1 
  AND payment_method = 'cod' 
  AND payment_status = 'pending'
  AND created_at > NOW() - INTERVAL '24 hours';

-- ==========================================
-- PART 6: DELIVERY QUERIES
-- ==========================================

-- [6.1] Get Partner Performance
SELECT * FROM partner_performance WHERE partner_id = $1;

-- [6.2] Update Partner Performance
UPDATE partner_performance SET 
    completed_orders = completed_orders + 1,
    total_trips = total_trips + 1,
    total_earnings = total_earnings + $2,
    weekly_earnings = weekly_earnings + $2,
    monthly_earnings = monthly_earnings + $2,
    updated_at = CURRENT_TIMESTAMP
WHERE partner_id = $1;

-- [6.2] Get Today's Earnings
SELECT COALESCE(SUM(partner_earnings), 0) as earnings, COUNT(*) as deliveries
FROM orders
WHERE delivery_partner_id = $1 
  AND status = 'delivered'
  AND DATE(delivered_at) = CURRENT_DATE;

-- [6.3] Get Weekly Earnings
SELECT COUNT(*) as deliveries, COALESCE(SUM(partner_earnings), 0) as earnings
FROM orders
WHERE delivery_partner_id = $1 
  AND status = 'delivered'
  AND delivered_at >= DATE_TRUNC('week', CURRENT_DATE);

-- [6.4] Get Monthly Earnings
SELECT COUNT(*) as deliveries, COALESCE(SUM(partner_earnings), 0) as earnings
FROM orders
WHERE delivery_partner_id = $1 
  AND status = 'delivered'
  AND delivered_at >= DATE_TRUNC('month', CURRENT_DATE);

-- [6.5] Get Daily Earnings (Last 7 Days)
SELECT DATE(delivered_at) as date, COUNT(*) as deliveries, 
       COALESCE(SUM(partner_earnings), 0) as earnings
FROM orders
WHERE delivery_partner_id = $1 
  AND status = 'delivered'
  AND delivered_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(delivered_at)
ORDER BY date DESC;

-- [6.6] Log Delivery Location
INSERT INTO delivery_logs (partner_id, location_lat, location_lng)
VALUES ($1, $2, $3);

-- [6.7] Log Delivery Status
INSERT INTO delivery_logs (order_id, partner_id, status, location_lat, location_lng)
VALUES ($1, $2, $3, $4, $5);

-- [6.8] Get Delivery History
SELECT o.*, u.name as customer_name, u.phone as customer_phone
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
WHERE o.delivery_partner_id = $1 
  AND o.status IN ('delivered', 'cancelled', 'returned')
ORDER BY o.created_at DESC
LIMIT $2 OFFSET $3;

-- ==========================================
-- PART 7: PAYMENT QUERIES
-- ==========================================

-- [7.1] Create Payment Transaction
INSERT INTO payment_transactions (order_id, user_id, amount, payment_method, payment_status, transaction_id, razorpay_order_id)
VALUES ($1, $2, $3, $4, 'pending', $5, $5);

-- [7.2] Verify Payment
UPDATE payment_transactions SET 
    payment_status = 'completed',
    gateway_response = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE razorpay_order_id = $1
RETURNING *;

-- [7.3] Get Payment by Transaction ID
SELECT * FROM payment_transactions WHERE transaction_id = $1;

-- [7.4] Get Payment by Razorpay Order ID
SELECT * FROM payment_transactions WHERE razorpay_order_id = $1;

-- [7.5] Get User Payment History
SELECT pt.*, o.id as order_id, o.status as order_status
FROM payment_transactions pt
LEFT JOIN orders o ON pt.order_id = o.id
WHERE pt.user_id = $1
ORDER BY pt.created_at DESC;

-- [7.6] Payment Retry Count (24 Hours) - SPAM PROTECTION
SELECT COUNT(*) as count FROM payment_transactions 
WHERE user_id = $1 
  AND payment_status = 'pending'
  AND created_at > NOW() - INTERVAL '24 hours';

-- [7.7] Store Payment Webhook
INSERT INTO payment_webhooks (event_id, event_type, payload)
VALUES ($1, $2, $3)
ON CONFLICT (event_id) DO NOTHING;

-- ==========================================
-- PART 8: SECURITY QUERIES
-- ==========================================

-- [8.1] Log Security Event
INSERT INTO security_audit_logs (user_id, event_type, event_details, ip_address, user_agent)
VALUES ($1, $2, $3, $4, $5);

-- [8.2] Get Audit Logs (Admin)
SELECT sal.*, u.name as user_name, u.email as user_email
FROM security_audit_logs sal
LEFT JOIN users u ON sal.user_id = u.id
WHERE ($1::text IS NULL OR sal.event_type = $1)
  AND ($2::integer IS NULL OR sal.user_id = $2)
ORDER BY sal.created_at DESC
LIMIT $3 OFFSET $4;

-- [8.3] Get Failed Login Attempts by IP
SELECT ip_address, COUNT(*) as attempts
FROM security_audit_logs
WHERE event_type = 'LOGIN_FAILED'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5;

-- [8.4] Get Failed 2FA Attempts
SELECT user_id, COUNT(*) as attempts
FROM security_audit_logs
WHERE event_type = '2FA_FAILED'
  AND created_at > NOW() - INTERVAL '15 minutes'
GROUP BY user_id
HAVING COUNT(*) >= 3;

-- [8.5] Add Token to Blacklist
INSERT INTO token_blacklist (token_hash, user_id, expires_at, reason)
VALUES ($1, $2, $3, $4)
ON CONFLICT (token_hash) DO NOTHING;

-- [8.6] Check Token Blacklisted
SELECT EXISTS(
    SELECT 1 FROM token_blacklist 
    WHERE token_hash = $1 
      AND expires_at > CURRENT_TIMESTAMP
);

-- [8.7] Cleanup Expired Tokens
DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;

-- [8.8] Create User Session
INSERT INTO user_sessions (user_id, refresh_token_hash, ip_address, user_agent, expires_at)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- [8.9] Get Active Sessions
SELECT id, ip_address, user_agent, created_at, last_used_at, expires_at
FROM user_sessions
WHERE user_id = $1 AND is_active = TRUE
ORDER BY last_used_at DESC;

-- [8.10] Revoke Session
UPDATE user_sessions SET is_active = FALSE WHERE id = $1 AND user_id = $2;

-- [8.11] Revoke All Sessions Except Current
UPDATE user_sessions 
SET is_active = FALSE 
WHERE user_id = $1 AND id != $2;

-- [8.12] Update Session Last Used
UPDATE user_sessions SET last_used_at = CURRENT_TIMESTAMP WHERE refresh_token_hash = $1;

-- [8.13] Get Suspicious COD Orders
SELECT user_id, COUNT(*) as orders
FROM orders
WHERE payment_method = 'cod'
  AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 10;

-- ==========================================
-- PART 9: REPORTS & ANALYTICS
-- ==========================================

-- [9.1] Daily Sales Report
SELECT DATE(o.created_at) as date,
       COUNT(*) as total_orders,
       COALESCE(SUM(o.total_price), 0) as revenue,
       COALESCE(SUM(o.delivery_fee), 0) as delivery_revenue
FROM orders o
WHERE o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(o.created_at)
ORDER BY date DESC;

-- [9.2] Category Sales Report
SELECT c.name as category,
       COUNT(DISTINCT oi.order_id) as total_orders,
       SUM(oi.quantity) as total_items,
       COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
FROM categories c
JOIN products p ON c.id = p.category_id
JOIN order_items oi ON p.id = oi.product_id
WHERE oi.order_id IN (
    SELECT id FROM orders 
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
)
GROUP BY c.id, c.name
ORDER BY revenue DESC;

-- [9.3] Top Selling Products
SELECT p.name,
       p.image_url,
       COUNT(oi.id) as order_count,
       SUM(oi.quantity) as total_sold,
       COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
FROM products p
JOIN order_items oi ON p.id = oi.product_id
WHERE oi.order_id IN (
    SELECT id FROM orders 
    WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
)
GROUP BY p.id, p.name, p.image_url
ORDER BY total_sold DESC
LIMIT 10;

-- [9.4] Delivery Partner Performance
SELECT u.name,
       COUNT(o.id) as total_orders,
       SUM(CASE WHEN o.status = 'delivered' THEN 1 ELSE 0 END) as completed,
       SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
       COALESCE(SUM(o.partner_earnings), 0) as earnings,
       COALESCE(AVG(pp.rating), 0) as rating
FROM users u
JOIN orders o ON u.id = o.delivery_partner_id
LEFT JOIN partner_performance pp ON u.id = pp.partner_id
WHERE u.role = 'delivery'
  AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.id, u.name, pp.rating
ORDER BY earnings DESC;

-- [9.5] Order Status Distribution
SELECT status, COUNT(*) as count
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY status;

-- [9.6] Payment Method Distribution
SELECT payment_method, COUNT(*) as count, COALESCE(SUM(total_price), 0) as revenue
FROM orders
WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY payment_method;

-- ==========================================
-- PART 10: VALIDATION QUERIES
-- ==========================================

-- [10.1] Check Stock Available
SELECT EXISTS(
    SELECT 1 FROM products 
    WHERE id = $1 AND stock >= $2 AND is_available = TRUE
);

-- [10.2] Validate Indian Phone
SELECT phone FROM users 
WHERE phone ~ '^[6-9]\d{9}$';

-- [10.3] Validate Email Format
SELECT email FROM users 
WHERE email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';

-- [10.4] Check Valid Coordinates (India)
SELECT * FROM users
WHERE latitude BETWEEN 6.0 AND 36.0
  AND longitude BETWEEN 68.0 AND 98.0;

-- [10.5] Get Duplicate Emails
SELECT email, COUNT(*) as count
FROM users
GROUP BY email
HAVING COUNT(*) > 1;

-- ==========================================
-- END OF SQL QUERIES GUIDE
-- ==========================================
