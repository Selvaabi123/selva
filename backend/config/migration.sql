-- ============================================================
-- MIGRATION SCRIPT (Add Missing Columns to Existing Schema)
-- Run this on existing database to add Zepto-style features
-- ============================================================

-- 1. Add columns to USERS table for Delivery Partner tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS today_earnings NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS active_order_id INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- 2. Add columns to CATEGORIES for store location
ALTER TABLE categories ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE categories ADD COLUMN IF NOT EXISTS address TEXT;

-- 3. Add columns to ORDERS for navigation & journey
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
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS picked_at TIMESTAMP;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP;

-- Add new status options
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'picked',
    'out_for_delivery',
    'arrived',
    'delivered',
    'cancelled'
  )
);

-- 4. Create PARTNER_PERFORMANCE table
CREATE TABLE IF NOT EXISTS partner_performance (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  total_earnings NUMERIC(10, 2) DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online) WHERE role = 'delivery';
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_partner ON orders(delivery_partner_id);

-- 6. Update existing delivery partners with performance records
INSERT INTO partner_performance (partner_id, rating, total_trips, completed_orders)
SELECT id, 4.50, 0, 0 FROM users WHERE role = 'delivery'
ON CONFLICT (partner_id) DO NOTHING;

-- 7. Add sample coordinates to categories (if empty)
UPDATE categories SET 
  latitude = 13.0827,
  longitude = 80.2707,
  address = 'Grocy-Mart Store, Chennai'
WHERE latitude IS NULL OR longitude IS NULL;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================

-- Check users table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- Check delivery partners with online status
-- SELECT id, name, is_online, today_earnings, active_order_id FROM users WHERE role = 'delivery';

-- Check partner performance
-- SELECT * FROM partner_performance;

-- Check orders with navigation fields
-- SELECT id, status, delivery_latitude, delivery_longitude, shop_latitude, shop_longitude FROM orders;
