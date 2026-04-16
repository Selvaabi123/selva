-- ============================================================
-- FOODAPP DATABASE SCHEMA (Updated for Zepto-Style Delivery)
-- ============================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS partner_performance CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================
-- USERS TABLE (Extended for Delivery Partners)
-- ============================================================
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'delivery')),
  phone VARCHAR(20),
  address TEXT,
  
  -- Delivery Partner Specific Fields
  is_online BOOLEAN DEFAULT FALSE,
  today_earnings NUMERIC(10, 2) DEFAULT 0,
  active_order_id INTEGER,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PARTNER PERFORMANCE TABLE (New)
-- ============================================================
CREATE TABLE partner_performance (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  rating DECIMAL(3, 2) DEFAULT 0,
  total_trips INTEGER DEFAULT 0,
  total_earnings NUMERIC(10, 2) DEFAULT 0,
  completed_orders INTEGER DEFAULT 0,
  cancelled_orders INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  image_url VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- PRODUCTS
-- ============================================================
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  image_url VARCHAR(255),
  stock INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ORDERS (Extended with Navigation Fields)
-- ============================================================
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  total_price NUMERIC(10, 2) NOT NULL,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'confirmed',
    'preparing',
    'ready_for_pickup',
    'picked',
    'out_for_delivery',
    'arrived',
    'delivered',
    'cancelled'
  )),
  delivery_partner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  
  -- Customer Info
  customer_name VARCHAR(100),
  customer_phone VARCHAR(20),
  customer_email VARCHAR(150),
  
  -- Addresses
  delivery_address TEXT,
  delivery_latitude DECIMAL(10, 8),
  delivery_longitude DECIMAL(11, 8),
  
  -- Store Info
  shop_name VARCHAR(200),
  shop_address TEXT,
  shop_latitude DECIMAL(10, 8),
  shop_longitude DECIMAL(11, 8),
  
  -- Order Items stored as JSON for pickup checklist
  items_json JSONB,
  
  -- Timestamps
  assigned_at TIMESTAMP,
  picked_at TIMESTAMP,
  delivered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- ORDER ITEMS (Individual Items)
-- ============================================================
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC(10, 2) NOT NULL
);

-- ============================================================
-- CART
-- ============================================================
CREATE TABLE cart (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- CART ITEMS
-- ============================================================
CREATE TABLE cart_items (
  id SERIAL PRIMARY KEY,
  cart_id INTEGER REFERENCES cart(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(cart_id, product_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_online ON users(is_online) WHERE role = 'delivery';
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_partner ON orders(delivery_partner_id);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_products_category ON products(category_id);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Default Users (password: password)
INSERT INTO users (name, email, password, role, phone, is_online) VALUES
('Admin User', 'admin@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '9999999999', FALSE),
('Delivery Raj', 'delivery@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'delivery', '8888888888', FALSE),
('Delivery Kumar', 'kumar@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'delivery', '7777777777', FALSE),
('Test Customer', 'user@foodapp.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'user', '6666666666', FALSE);

-- Partner Performance Records
INSERT INTO partner_performance (partner_id, rating, total_trips, completed_orders) VALUES
(2, 4.50, 45, 42),
(3, 4.80, 78, 75);

-- Categories
INSERT INTO categories (name, image_url, latitude, longitude, address) VALUES
('Burgers', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 13.0827, 80.2707, '123 Food Street, Chennai'),
('Pizza', 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 13.0827, 80.2707, '456 Pizza Lane, Chennai'),
('Biryani', 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', 13.0827, 80.2707, '789 Spice Road, Chennai'),
('Desserts', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', 13.0827, 80.2707, '321 Sweet Avenue, Chennai'),
('Beverages', 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', 13.0827, 80.2707, '654 Drink Blvd, Chennai');

-- Products
INSERT INTO products (name, description, price, category_id, image_url, stock) VALUES
('Classic Beef Burger', 'Juicy beef patty with fresh lettuce, tomato, and special sauce', 299.00, 1, 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', 50),
('Chicken Crispy Burger', 'Crispy fried chicken fillet burger with coleslaw', 349.00, 1, 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400', 40),
('Margherita Pizza', 'Classic tomato sauce, fresh mozzarella, and basil', 499.00, 2, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400', 25),
('Pepperoni Pizza', 'Loaded with premium pepperoni and mozzarella', 599.00, 2, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400', 20),
('Chicken Biryani', 'Aromatic basmati rice with tender chicken, saffron, and spices', 399.00, 3, 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400', 35),
('Mutton Biryani', 'Slow-cooked mutton with fragrant long-grain rice', 499.00, 3, 'https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=400', 25),
('Chocolate Lava Cake', 'Warm molten chocolate cake with vanilla ice cream', 249.00, 4, 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400', 20),
('Mango Cheesecake', 'Creamy New York style cheesecake with fresh mango topping', 299.00, 4, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=400', 15),
('Cold Brew Coffee', 'Smooth 24-hour cold brew, served over ice', 199.00, 5, 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400', 60),
('Fresh Lime Soda', 'Freshly squeezed lime with sparkling water and mint', 129.00, 5, 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400', 80);

-- Sample Order for Testing
INSERT INTO orders (
  user_id, total_price, status, delivery_partner_id,
  customer_name, customer_phone, delivery_address,
  delivery_latitude, delivery_longitude,
  shop_name, shop_address, shop_latitude, shop_longitude,
  items_json
) VALUES (
  4, 798.00, 'pending', NULL,
  'Test Customer', '6666666666', '789 Customer Street, Chennai',
  13.0827, 80.2707,
  'FoodApp Kitchen', '123 Food Street, Chennai', 13.0827, 80.2707,
  '[{"name": "Chicken Biryani", "quantity": 2, "price": 399}, {"name": "Cold Brew Coffee", "quantity": 1, "price": 199}]'
);
