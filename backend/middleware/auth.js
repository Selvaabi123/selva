const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const BLACKLIST_TTL = 24 * 60 * 60 * 1000;

const tokenBlacklist = new Map();

const addToBlacklist = (token, expiresIn = BLACKLIST_TTL) => {
  const decoded = jwt.decode(token);
  if (decoded && decoded.exp) {
    const ttl = (decoded.exp * 1000) - Date.now();
    tokenBlacklist.set(token, Date.now() + Math.min(ttl, BLACKLIST_TTL));
    
    setTimeout(() => {
      tokenBlacklist.delete(token);
    }, Math.max(ttl, 0));
  }
};

const isBlacklisted = (token) => {
  if (tokenBlacklist.has(token)) {
    const expiry = tokenBlacklist.get(token);
    if (Date.now() < expiry) {
      return true;
    }
    tokenBlacklist.delete(token);
  }
  return false;
};

const authenticate = async (req, res, next) => {
  let token = req.cookies?.token;
  
  if (!token && req.headers.authorization) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  if (isBlacklisted(token)) {
    return res.status(401).json({ success: false, message: 'Token has been revoked' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    req.user = result.rows[0];
    req.token = token;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied: insufficient permissions' });
  }
  next();
};

const authorizeDelivery = (req, res, next) => {
  if (req.user.role !== 'delivery') {
    return res.status(403).json({ success: false, message: 'Access denied: delivery partners only' });
  }
  next();
};

module.exports = { 
  authenticate, 
  authorize, 
  authorizeDelivery,
  addToBlacklist,
  isBlacklisted
};
