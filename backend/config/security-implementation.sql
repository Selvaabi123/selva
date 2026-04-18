-- ==========================================
-- Grocy-Mart Security Implementation SQL
-- ==========================================
-- This file contains all security-related 
-- database queries and configurations
-- ==========================================

-- ==========================================
-- SECTION 1: SECURITY TABLES
-- ==========================================

-- Token Blacklist Table (for future Redis migration)
-- Currently using in-memory Map, this table ready for production
CREATE TABLE IF NOT EXISTS token_blacklist (
    id SERIAL PRIMARY KEY,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    blacklisted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    reason VARCHAR(50) DEFAULT 'logout'
);

CREATE INDEX idx_token_blacklist_token ON token_blacklist(token_hash);
CREATE INDEX idx_token_blacklist_expires ON token_blacklist(expires_at);

-- ==========================================
-- SECTION 2: SECURITY TRIGGERS
-- ==========================================

-- Auto-cleanup expired blacklisted tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
    DELETE FROM token_blacklist WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SECTION 3: SECURITY QUERIES
-- ==========================================

-- Check if token is blacklisted
-- Parameters: $1 = token_hash
SELECT EXISTS(
    SELECT 1 FROM token_blacklist 
    WHERE token_hash = $1 
    AND expires_at > CURRENT_TIMESTAMP
);

-- Add token to blacklist
-- Parameters: $1 = token_hash, $2 = user_id, $3 = expires_at
INSERT INTO token_blacklist (token_hash, user_id, expires_at)
VALUES ($1, $2, $3)
ON CONFLICT (token_hash) DO NOTHING;

-- ==========================================
-- SECTION 4: RATE LIMITING HELPERS
-- ==========================================

-- COD Order Count (last 24 hours)
-- Parameters: $1 = user_id
SELECT COUNT(*) as cod_orders_24h FROM orders 
WHERE user_id = $1 
AND payment_method = 'cod' 
AND payment_status = 'pending'
AND created_at > NOW() - INTERVAL '24 hours';

-- Payment Retry Count (last 24 hours)
-- Parameters: $1 = user_id
SELECT COUNT(*) as payment_attempts_24h FROM payment_transactions 
WHERE user_id = $1 
AND payment_status = 'pending'
AND created_at > NOW() - INTERVAL '24 hours';

-- ==========================================
-- SECTION 5: AUDIT LOGGING
-- ==========================================

-- Security Audit Log Table
CREATE TABLE IF NOT EXISTS security_audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    event_details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_user ON security_audit_logs(user_id);
CREATE INDEX idx_audit_type ON security_audit_logs(event_type);
CREATE INDEX idx_audit_time ON security_audit_logs(created_at);

-- Common event types:
-- 'LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 
-- '2FA_SUCCESS', '2FA_FAILED', '2FA_LOCKED',
-- 'TOKEN_REFRESH', 'TOKEN_REVOKED',
-- 'PASSWORD_CHANGE', 'PASSWORD_RESET',
-- 'ADMIN_ACCESS', 'UNAUTHORIZED_ACCESS',
-- 'RATE_LIMIT_EXCEEDED', 'SUSPICIOUS_ACTIVITY'

-- ==========================================
-- SECTION 6: SUSPICIOUS ACTIVITY QUERIES
-- ==========================================

-- Failed login attempts by IP (last hour)
SELECT ip_address, COUNT(*) as attempts
FROM security_audit_logs
WHERE event_type = 'LOGIN_FAILED'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY ip_address
HAVING COUNT(*) > 5;

-- Multiple failed 2FA attempts
SELECT user_id, COUNT(*) as attempts
FROM security_audit_logs
WHERE event_type = '2FA_FAILED'
AND created_at > NOW() - INTERVAL '15 minutes'
GROUP BY user_id
HAVING COUNT(*) >= 3;

-- Unusual order patterns (COD spam)
SELECT user_id, COUNT(*) as orders
FROM orders
WHERE payment_method = 'cod'
AND created_at > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 10;

-- ==========================================
-- SECTION 7: ACCESS CONTROL QUERIES
-- ==========================================

-- Check user role
SELECT id, name, email, role FROM users WHERE id = $1;

-- Get all admins
SELECT id, name, email, phone FROM users WHERE role = 'admin';

-- Get all delivery partners
SELECT id, name, email, phone, is_online FROM users WHERE role = 'delivery';

-- Get user permissions (extensible for RBAC)
CREATE TABLE IF NOT EXISTS user_permissions (
    id SERIAL PRIMARY KEY,
    role VARCHAR(20) NOT NULL,
    resource VARCHAR(50) NOT NULL,
    action VARCHAR(20) NOT NULL,
    UNIQUE(role, resource, action)
);

-- Default permissions
INSERT INTO user_permissions (role, resource, action) VALUES
-- Admin has all permissions
('admin', '*', '*'),
-- Delivery can only access delivery endpoints
('delivery', 'delivery', 'read'),
('delivery', 'delivery', 'update'),
-- Regular users
('user', 'orders', 'create'),
('user', 'orders', 'read'),
('user', 'cart', 'read'),
('user', 'cart', 'update');

-- ==========================================
-- SECTION 8: PAYMENT SECURITY
-- ==========================================

-- Store Razorpay webhook events for audit
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

-- Payment amount validation (never trust client amounts)
-- Server-side price calculation
SELECT 
    p.id,
    p.name,
    p.price,
    ci.quantity,
    (p.price * ci.quantity) as line_total
FROM cart_items ci
JOIN products p ON ci.product_id = p.id
WHERE ci.cart_id = $1;

-- ==========================================
-- SECTION 9: INPUT VALIDATION HELPERS
-- ==========================================

-- Sanitize text input
CREATE OR REPLACE FUNCTION sanitize_input(input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Remove potential XSS vectors
    input := regexp_replace(input, '<script[^>]*>.*?</script>', '', 'gi');
    input := regexp_replace(input, '<[^>]+>', '', 'gi');
    input := regexp_replace(input, 'javascript:', '', 'gi');
    input := regexp_replace(input, 'on\w+\s*=', '', 'gi');
    -- Trim and limit length
    RETURN TRIM(LEFT(input, 500));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validate email format
CREATE OR REPLACE FUNCTION is_valid_email(email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validate phone (Indian format)
CREATE OR REPLACE FUNCTION is_valid_phone(phone TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN phone ~ '^[6-9]\d{9}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- SECTION 10: GEO-LOCATION VALIDATION
-- ==========================================

-- Validate coordinates are within India (approximate)
CREATE OR REPLACE FUNCTION is_valid_indian_coordinates(
    lat DECIMAL, 
    lon DECIMAL
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        lat BETWEEN 6.0 AND 36.0 AND
        lon BETWEEN 68.0 AND 98.0
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ==========================================
-- SECTION 11: SESSION MANAGEMENT
-- ==========================================

-- Active sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
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

-- Max sessions per user (prevent token multiplication)
-- Parameters: $1 = user_id, $2 = max_sessions
SELECT COUNT(*) FROM user_sessions 
WHERE user_id = $1 
AND is_active = TRUE
AND expires_at > CURRENT_TIMESTAMP;

-- ==========================================
-- SECTION 12: ADMIN 2FA SETUP
-- ==========================================

-- Admin 2FA settings table
CREATE TABLE IF NOT EXISTS admin_security_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    two_factor_enabled BOOLEAN DEFAULT TRUE,
    backup_codes TEXT[], -- encrypted backup codes
    phone_verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    last_2fa_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- SECTION 13: API KEY MANAGEMENT
-- ==========================================

-- API Keys for external integrations
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '["read"]',
    rate_limit INTEGER DEFAULT 100, -- requests per minute
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_api_key ON api_keys(key_hash);
CREATE INDEX idx_api_key_user ON api_keys(user_id);

-- ==========================================
-- SECTION 14: CORS CONFIGURATION
-- ==========================================

-- Allowed origins table (for dynamic CORS)
CREATE TABLE IF NOT EXISTS allowed_origins (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_production BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default allowed origins
INSERT INTO allowed_origins (origin, description, is_production) VALUES
('http://localhost:5173', 'User Frontend Dev', FALSE),
('http://localhost:3000', 'Admin Frontend Dev', FALSE),
('http://localhost:3001', 'Delivery Frontend Dev', FALSE),
-- Add production URLs here when deploying
-- ('https://yourdomain.com', 'Production User App', TRUE),
-- ('https://admin.yourdomain.com', 'Production Admin', TRUE);

-- ==========================================
-- SECTION 15: SECURITY CONSTANTS (Reference)
-- ==========================================

/*
-- JWT Configuration
JWT_SECRET = your-256-bit-secret
JWT_EXPIRES_IN = 1 hour
REFRESH_TOKEN_EXPIRES_IN = 7 days

-- Rate Limits
AUTH_RATE_LIMIT = 5 per 15 minutes
API_RATE_LIMIT = 100 per 15 minutes
OTP_RATE_LIMIT = 3 attempts, then 15 min lock
COD_ORDER_LIMIT = 5 per 24 hours per user
PAYMENT_RETRY_LIMIT = 5 per 24 hours per user

-- Password Policy
MIN_PASSWORD_LENGTH = 8
PASSWORD_REQUIRE_UPPERCASE = true
PASSWORD_REQUIRE_LOWERCASE = true
PASSWORD_REQUIRE_NUMBER = true
PASSWORD_REQUIRE_SPECIAL = false
PASSWORD_MAX_AGE_DAYS = 90

-- Session Policy
MAX_SESSIONS_PER_USER = 5
SESSION_TIMEOUT_MINUTES = 30
FORCE_RELOGIN_AFTER_PASSWORD_CHANGE = true

-- Admin 2FA
ADMIN_2FA_OTP_LENGTH = 6 digits
ADMIN_2FA_MAX_ATTEMPTS = 3
ADMIN_2FA_LOCKOUT_MINUTES = 15
*/

-- ==========================================
-- EXECUTE THIS FOR INITIAL SETUP:
-- ==========================================

-- Run in psql:
-- \i security_implementation.sql

-- Or run individual sections as needed

-- ==========================================
-- END OF SECURITY IMPLEMENTATION SQL
-- ==========================================
