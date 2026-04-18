-- ==========================================
-- GROCY-MART COMPLETE SCHEMA
-- Includes App Tables + Security Tables
-- Run: psql -U postgres -d foodapp -f complete_schema.sql
-- ==========================================

-- ==========================================
-- SECTION 1: APP TABLES (Original)
-- ==========================================

-- Drop existing tables
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS partner_performance CASCADE;
DROP TABLE IF EXISTS delivery_logs CASCADE;

-- ==========================================
-- USERS TABLE
-- ==========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'delivery')),
    phone VARCHAR(20),
    address TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    today_earnings NUMERIC(10, 2) DEFAULT 0,
    active_order_id INTEGER,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- CATEGORIES TABLE
-- ==========================================
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    image_url TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PRODUCTS TABLE
-- ==========================================
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ORDERS TABLE
-- ==========================================
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_price NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) DEFAULT 0,
    delivery_fee NUMERIC(10, 2) DEFAULT 0,
    partner_earnings NUMERIC(10, 2) DEFAULT 0,
    company_earnings NUMERIC(10, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','picked','out_for_delivery','delivered','cancelled')),
    delivery_partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    payment_method VARCHAR(20) DEFAULT 'cod' CHECK (payment_method IN ('cod', 'upi', 'card', 'online')),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
    delivery_address TEXT,
    notes TEXT,
    delivery_otp VARCHAR(10),
    delivery_latitude DECIMAL(10, 8),
    delivery_longitude DECIMAL(11, 8),
    arrived_at_store_at TIMESTAMP,
    picked_at TIMESTAMP,
    delivered_at TIMESTAMP,
    delivery_started_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ORDER ITEMS TABLE
-- ==========================================
CREATE TABLE order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL
);

-- ==========================================
-- CART TABLE
-- ==========================================
CREATE TABLE cart (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- CART ITEMS TABLE
-- ==========================================
CREATE TABLE cart_items (
    id SERIAL PRIMARY KEY,
    cart_id INTEGER REFERENCES cart(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    UNIQUE(cart_id, product_id)
);

-- ==========================================
-- PARTNER PERFORMANCE TABLE
-- ==========================================
CREATE TABLE partner_performance (
    id SERIAL PRIMARY KEY,
    partner_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    rating DECIMAL(3, 2) DEFAULT 0,
    total_trips INTEGER DEFAULT 0,
    total_earnings NUMERIC(10, 2) DEFAULT 0,
    weekly_earnings NUMERIC(10, 2) DEFAULT 0,
    monthly_earnings NUMERIC(10, 2) DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    cancelled_orders INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- DELIVERY LOGS TABLE
-- ==========================================
CREATE TABLE delivery_logs (
    id SERIAL PRIMARY KEY,
    order_id INTEGER,
    partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50),
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- ORDER ISSUES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS order_issues (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    issue_type VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- PAYMENT TRANSACTIONS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_transactions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'razorpay',
    payment_status VARCHAR(20) DEFAULT 'pending',
    transaction_id VARCHAR(100),
    razorpay_order_id VARCHAR(100),
    gateway_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES
-- ==========================================
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_delivery ON orders(delivery_partner_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_payment_txn_user ON payment_transactions(user_id);
CREATE INDEX idx_payment_txn_razorpay ON payment_transactions(razorpay_order_id);

-- ==========================================
-- SECTION 2: SECURITY TABLES (NEW)
-- ==========================================

-- ==========================================
-- SECURITY AUDIT LOGS
-- ==========================================
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON security_audit_logs(user_id);
CREATE INDEX idx_audit_type ON security_audit_logs(event_type);
CREATE INDEX idx_audit_time ON security_audit_logs(created_at);

-- ==========================================
-- TOKEN BLACKLIST
-- ==========================================
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(50) DEFAULT 'logout'
);

CREATE INDEX idx_blacklist_token ON token_blacklist(token_hash);
CREATE INDEX idx_blacklist_expires ON token_blacklist(expires_at);

-- ==========================================
-- USER SESSIONS
-- ==========================================
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(64) NOT NULL UNIQUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_session_user ON user_sessions(user_id);
CREATE INDEX idx_session_token ON user_sessions(refresh_token_hash);

-- ==========================================
-- ADMIN SECURITY SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS admin_security_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    backup_codes TEXT[],
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_2fa_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- USER PRIVACY SETTINGS
-- ==========================================
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    share_location BOOLEAN DEFAULT TRUE,
    share_order_history BOOLEAN DEFAULT FALSE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- API KEYS
-- ==========================================
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '["read"]',
    rate_limit INTEGER DEFAULT 100,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_key ON api_keys(key_hash);
CREATE INDEX idx_api_key_user ON api_keys(user_id);

-- ==========================================
-- PAYMENT WEBHOOKS
-- ==========================================
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id SERIAL PRIMARY KEY,
    event_id VARCHAR(100) UNIQUE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_webhook_event ON payment_webhooks(event_id);
CREATE INDEX idx_webhook_type ON payment_webhooks(event_type);

-- ==========================================
-- ALLOWED ORIGINS
-- ==========================================
CREATE TABLE IF NOT EXISTS allowed_origins (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_production BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- SECTION 3: SEED DATA
-- ==========================================

-- Default Admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone, address) VALUES
('Admin User', 'admin@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '9999999999', 'Admin Office, Trichy'),
('Delivery Partner 1', 'delivery@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'delivery', '8888888888', 'Trichy'),
('Test Customer', 'user@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '7777777777', 'Customer Address, Trichy');

-- NOTE: Default password for all seed users is "password"

-- Insert delivery partner performance records
INSERT INTO partner_performance (partner_id, rating, total_trips, completed_orders)
SELECT id, 4.50, 0, 0 FROM users WHERE role = 'delivery'
ON CONFLICT (partner_id) DO NOTHING;

-- Admin security settings
INSERT INTO admin_security_settings (user_id, two_factor_enabled)
SELECT id, TRUE FROM users WHERE role = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Categories
INSERT INTO categories (name, image_url, latitude, longitude, address) VALUES
('Fruits & Vegetables', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400', 10.7905, 78.7041, 'Shop 1, Market St, Trichy'),
('Dairy & Eggs', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400', 10.7905, 78.7041, 'Shop 2, Market St, Trichy'),
('Rice & Grains', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 10.7905, 78.7041, 'Shop 3, Market St, Trichy'),
('Oil & Ghee', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', 10.7905, 78.7041, 'Shop 4, Market St, Trichy'),
('Spices & Masala', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 10.7905, 78.7041, 'Shop 5, Market St, Trichy'),
('Snacks & Biscuits', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 10.7905, 78.7041, 'Shop 6, Market St, Trichy'),
('Beverages', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', 10.7905, 78.7041, 'Shop 7, Market St, Trichy'),
('Personal Care', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 10.7905, 78.7041, 'Shop 8, Market St, Trichy');

-- Products
INSERT INTO products (name, description, price, category_id, image_url, stock) VALUES
('Fresh Tomatoes (1kg)', 'Farm fresh red tomatoes, perfect for cooking', 49.00, 1, 'https://images.unsplash.com/photo-1546470427-227c7a715614?w=400', 100),
('Organic Bananas (1 dozen)', 'Ripe and sweet organic bananas', 79.00, 1, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', 80),
('Fresh Green Spinach (500g)', 'Cleaned and fresh baby spinach leaves', 35.00, 1, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', 60),
('Amul Butter (500g)', 'Premium quality salted butter', 299.00, 2, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', 40),
('Mother Dairy Milk (1L)', 'Fresh and pure toned milk', 60.00, 2, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', 50),
('Farm Fresh Eggs (12 pcs)', 'Farm fresh brown eggs, high protein', 90.00, 2, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400', 70),
('Basmati Rice (5kg)', 'Premium long grain basmati rice', 450.00, 3, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 30),
('Wheat Flour (5kg)', 'Whole wheat atta for fresh chapati', 220.00, 3, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', 40),
('Moong Dal (1kg)', 'Yellow moong dal, high protein', 149.00, 3, 'https://images.unsplash.com/photo-1612257416648-ee7a6c8d1a7b?w=400', 50),
('Fortune Sunflower Oil (1L)', 'Light and healthy refined sunflower oil', 170.00, 4, 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400', 45),
('Ghee (1L)', 'Pure and authentic cow ghee', 550.00, 4, 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400', 25),
('Red Chilli Powder (200g)', 'Premium quality red chilli powder', 89.00, 5, 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400', 60),
('Garam Masala (100g)', 'Aromatic homemade garam masala blend', 120.00, 5, 'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400', 55),
('Parle-G Biscuits (250g)', 'India favorite glucose biscuits', 25.00, 6, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400', 100),
('Oreo Biscuits (120g)', 'Cream filled chocolate sandwich cookies', 90.00, 6, 'https://images.unsplash.com/photo-1619473496602-25e9b07b3a4e?w=400', 80),
('Coca Cola (2L)', 'Refreshing carbonated soft drink', 80.00, 7, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', 60),
('Real Fruit Juice (1L)', 'Made from real fruits, no added sugar', 120.00, 7, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400', 50),
('Head & Shoulders Shampoo (340ml)', 'Anti-dandruff shampoo for healthy scalp', 349.00, 8, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400', 35),
('Colgate Toothpaste (100g)', 'Fluoride toothpaste for cavity protection', 120.00, 8, 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400', 60);

-- Allowed Origins
INSERT INTO allowed_origins (origin, description, is_production) VALUES
('http://localhost:5173', 'User Frontend Dev', FALSE),
('http://localhost:3000', 'Admin Frontend Dev', FALSE),
('http://localhost:3001', 'Delivery Frontend Dev', FALSE);

-- ==========================================
-- SECTION 4: HELPER FUNCTIONS
-- ==========================================

-- Cleanup expired blacklisted tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Sanitize input text
CREATE OR REPLACE FUNCTION sanitize_input(input TEXT)
RETURNS TEXT AS $$
BEGIN
    input := regexp_replace(input, '<script[^>]*>.*?</script>', '', 'gi');
    input := regexp_replace(input, '<[^>]+>', '', 'gi');
    input := regexp_replace(input, 'javascript:', '', 'gi');
    input := regexp_replace(input, 'on\w+\s*=', '', 'gi');
    RETURN TRIM(LEFT(input, 500));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- COMPLETE!
-- ==========================================
