-- ============================================================
-- FOODAPP DATABASE SCHEMA
-- Run this file to initialize the database
-- psql -U postgres -d foodapp -f schema.sql
-- ============================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS
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

-- CATEGORIES
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  image_url TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PRODUCTS
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

-- ORDERS
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_price NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','preparing','picked','out_for_delivery','delivered','cancelled')),
  delivery_partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed','refunded')),
  delivery_address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ORDER ITEMS
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

-- CART
CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CART ITEMS
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES cart(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(cart_id, product_id)
);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Admin user (password: admin123)
INSERT INTO users (name, email, password, role, phone) VALUES
('Admin User', 'admin@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '9999999999'),
('Delivery Partner 1', 'delivery@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'delivery', '8888888888'),
('Test Customer', 'user@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '7777777777');

-- NOTE: Default password for all seed users is "password"
-- Change this in production!

-- Categories
INSERT INTO categories (name, image_url) VALUES
('Fruits & Vegetables', 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400'),
('Dairy & Eggs', 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400'),
('Rice & Grains', 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400'),
('Oil & Ghee', 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400'),
('Spices & Masala', 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400'),
('Snacks & Biscuits', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400'),
('Beverages', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400'),
('Personal Care', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400');

-- Products
INSERT INTO products (name, description, price, category_id, image_url, stock) VALUES
('Fresh Tomatoes (1kg)', 'Farm fresh red tomatoes, perfect for cooking', 49.00, 1, 'https://images.unsplash.com/photo-1546470427-227c7a715614?w=400', 100),
('Organic Bananas (1 dozen)', 'Ripe and sweet organic bananas', 79.00, 1, 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400', 80),
('Fresh Green Spinach (500g)', 'Cleaned and fresh baby spinach leaves', 35.00, 1, 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400', 60),
('Amul Butter (500g)', 'Premium quality salted butter', 299.00, 2, 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400', 40),
('Mother Dairy Milk (1L)', 'Fresh and pure toned milk', 60.00, 2, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400', 50),
('Farm Fresh Eggs (12 pcs)', 'Farm fresh brown eggs, high protein', 90.00, 2, 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400', 70),
('Basmati Rice (5kg)', 'Premium long grain basmati rice', 450.00, 3, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400', 30),
('Wheat Flour (5kg)', 'Whole wheat at ta for fresh chapati', 220.00, 3, 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400', 40),
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

-- Indexes for performance
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_delivery ON orders(delivery_partner_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- PARTNER PERFORMANCE
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

-- Insert delivery partner performance records
INSERT INTO partner_performance (partner_id, rating, total_trips, completed_orders)
SELECT id, 4.50, 0, 0 FROM users WHERE role = 'delivery'
ON CONFLICT (partner_id) DO NOTHING;

-- DELIVERY LOGS
CREATE TABLE IF NOT EXISTS delivery_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER,
  partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
