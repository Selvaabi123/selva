-- ============================================================
-- FOODAPP DELIVERY PARTNER - FULL MIGRATION
-- Run: psql -U your_user -d foodapp -f migration_full.sql
-- ============================================================

-- ============================================================
-- 1. ADD COLUMNS TO USERS TABLE
-- ============================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS today_earnings NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_order_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- ============================================================
-- 2. ADD COLUMNS TO ORDERS TABLE
-- ============================================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_otp VARCHAR(4);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS arrived_at_store_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS picked_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_started_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(150);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_name VARCHAR(200);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_latitude DECIMAL(10, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shop_longitude DECIMAL(11, 8);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items_json JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimated_delivery_time TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS distance_km DECIMAL(5, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10, 2) DEFAULT 30;

-- ============================================================
-- 3. UPDATE ORDERS STATUS CONSTRAINT
-- ============================================================
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'assigned',
    'arrived_at_store',
    'picked',
    'out_for_delivery',
    'arrived_at_door',
    'delivered',
    'cancelled',
    'returned'
  )
);

-- ============================================================
-- 4. CREATE PARTNER_PERFORMANCE TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS partner_performance (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  
  -- Ratings
  rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_ratings INTEGER DEFAULT 0,
  
  -- Trip Stats
  total_trips INTEGER DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  
  -- Earnings
  total_earnings DECIMAL(12, 2) DEFAULT 0,
  weekly_earnings DECIMAL(12, 2) DEFAULT 0,
  monthly_earnings DECIMAL(12, 2) DEFAULT 0,
  
  -- Performance
  avg_delivery_time_minutes INTEGER DEFAULT 0,
  on_time_delivery_rate DECIMAL(5, 2) DEFAULT 100,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 5. CREATE ORDER_ISSUES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS order_issues (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Issue Details
  issue_type VARCHAR(50) NOT NULL CHECK (issue_type IN (
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
  )),
  description TEXT,
  resolution VARCHAR(100),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- ============================================================
-- 6. CREATE DELIVERY_LOGS TABLE (for analytics)
-- ============================================================
CREATE TABLE IF NOT EXISTS delivery_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  
  -- Timeline
  status VARCHAR(30),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 7. CREATE INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online) WHERE role = 'delivery';
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude) WHERE role = 'delivery';
CREATE INDEX IF NOT EXISTS idx_orders_partner_status ON orders(delivery_partner_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_order ON delivery_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_partner_performance_partner ON partner_performance(partner_id);

-- ============================================================
-- 8. UPDATE EXISTING DELIVERY PARTNERS
-- ============================================================
INSERT INTO partner_performance (partner_id, rating, total_trips, completed_orders)
SELECT id, 4.50, 0, 0 FROM users WHERE role = 'delivery'
ON CONFLICT (partner_id) DO NOTHING;

-- ============================================================
-- 9. UPDATE ORDERS WITH SAMPLE DATA
-- ============================================================
-- Update existing orders with customer info
UPDATE orders o SET 
  customer_name = u.name,
  customer_phone = u.phone,
  customer_email = u.email,
  delivery_latitude = 13.0827,
  delivery_longitude = 80.2707,
  shop_name = 'FoodApp Kitchen',
  shop_address = '123 Food Street, Chennai',
  shop_latitude = 13.0827,
  shop_longitude = 80.2707,
  items_json = (
    SELECT json_agg(json_build_object('name', p.name, 'quantity', oi.quantity, 'price', oi.price))
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = o.id
  ),
  distance_km = ROUND(RANDOM() * 5 + 1, 2),
  delivery_fee = 30
WHERE customer_name IS NULL;

-- ============================================================
-- 10. VERIFICATION QUERIES
-- ============================================================
-- Check users columns: SELECT column_name FROM information_schema.columns WHERE table_name = 'users';
-- Check orders columns: SELECT column_name FROM information_schema.columns WHERE table_name = 'orders';
-- Check partner_performance: SELECT * FROM partner_performance LIMIT 5;
-- Check order_issues: SELECT * FROM order_issues LIMIT 5;
