const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const pool = require('../config/db');
const logger = require('../utils/logger');
const { addToBlacklist } = require('../middleware/auth');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const admin2FAAttempts = new Map();
const MAX_2FA_ATTEMPTS = 3;
const ADMIN_2FA_LOCKOUT = 15 * 60 * 1000;

const generateAdminOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const pendingAdmin2FA = new Map();

const refreshTokens = new Map();

const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  refreshTokens.set(refreshToken, {
    userId: user.id,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
  });
  return refreshToken;
};

const isRefreshTokenValid = (token) => {
  const data = refreshTokens.get(token);
  if (!data) return null;
  if (Date.now() > data.expiresAt) {
    refreshTokens.delete(token);
    return null;
  }
  return data;
};

const revokeRefreshToken = (token) => {
  refreshTokens.delete(token);
};

const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, phone, address } = req.body;
  try {
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, phone, address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, phone',
      [name, email, hashed, 'user', phone || null, address || null]
    );

    const user = result.rows[0];
    const token = generateToken(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    const { password: _, ...safeUser } = user;
    logger.info('User registered successfully', { userId: user.id, email: user.email });
    res.status(201).json({ success: true, user: safeUser });
  } catch (err) {
    logger.error('Registration failed', { error: err.message });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      logger.warn('Login failed - user not found', { email });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logger.warn('Login failed - invalid password', { userId: user.id });
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.role === 'admin') {
      const otp = generateAdminOTP();
      pendingAdmin2FA.set(email, {
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000,
        user
      });
      
      console.log(`\n🔐 ADMIN 2FA OTP for ${email}: ${otp}\n`);
      logger.info('Admin 2FA OTP generated', { userId: user.id, email, otpLast4: otp.slice(-4) });
      
      return res.json({ 
        success: true, 
        require2FA: true,
        message: '2FA verification required',
        maskPhone: user.phone ? `****${user.phone.slice(-4)}` : null
      });
    }

    const token = generateToken(user);
    const { password: _, ...safeUser } = user;

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });

    logger.info('User logged in successfully', { userId: user.id, role: user.role });
    
    const refreshToken = generateRefreshToken(user);
    res.json({ success: true, user: safeUser, refreshToken });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const verifyAdmin2FA = async (req, res) => {
  const { email, otp } = req.body;
  
  const pending = pendingAdmin2FA.get(email);
  if (!pending) {
    return res.status(400).json({ success: false, message: 'No pending 2FA verification. Please login again.' });
  }
  
  if (Date.now() > pending.expiresAt) {
    pendingAdmin2FA.delete(email);
    return res.status(400).json({ success: false, message: '2FA OTP expired. Please login again.' });
  }
  
  const attempts = admin2FAAttempts.get(email) || { count: 0, lockedUntil: 0 };
  if (Date.now() < attempts.lockedUntil) {
    const remaining = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    return res.status(429).json({ success: false, message: `Too many attempts. Try again in ${remaining} minutes.` });
  }
  
  if (pending.otp !== otp) {
    attempts.count++;
    if (attempts.count >= MAX_2FA_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + ADMIN_2FA_LOCKOUT;
      pendingAdmin2FA.delete(email);
      logger.warn('Admin 2FA locked due to too many attempts', { email });
      return res.status(429).json({ success: false, message: 'Too many attempts. Locked for 15 minutes.' });
    }
    admin2FAAttempts.set(email, attempts);
    logger.warn('Admin 2FA failed', { email, attempts: attempts.count });
    return res.status(400).json({ success: false, message: 'Invalid OTP', attemptsLeft: MAX_2FA_ATTEMPTS - attempts.count });
  }
  
  admin2FAAttempts.delete(email);
  pendingAdmin2FA.delete(email);
  
  const token = generateToken(pending.user);
  const { password: _, ...safeUser } = pending.user;
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000
  });
  
  logger.info('Admin logged in with 2FA', { userId: pending.user.id, role: pending.user.role });
  
  const refreshToken = generateRefreshToken(pending.user);
  res.json({ success: true, user: safeUser, refreshToken });
};

const logout = (req, res) => {
  if (req.token) {
    addToBlacklist(req.token);
    logger.info('Token added to blacklist', { userId: req.user?.id });
  }
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });
  logger.info('User logged out', { userId: req.user?.id });
  res.json({ success: true, message: 'Logged out successfully' });
};

const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Refresh token required' });
  }
  
  const tokenData = isRefreshTokenValid(refreshToken);
  if (!tokenData) {
    return res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
  
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [tokenData.userId]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found' });
    }
    
    const user = result.rows[0];
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    
    revokeRefreshToken(refreshToken);
    
    res.cookie('token', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000
    });
    
    logger.info('Token refreshed successfully', { userId: user.id });
    res.json({ success: true, user, refreshToken: newRefreshToken });
  } catch (err) {
    logger.error('Token refresh error', { error: err.message });
    res.status(500).json({ success: false, message: 'Failed to refresh token' });
  }
};

module.exports = { register, login, logout, getMe, verifyAdmin2FA, refreshAccessToken };
