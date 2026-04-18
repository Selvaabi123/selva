const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, address, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: result.rows });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const createUser = async (req, res) => {
  const { name, email, password, role, phone, address } = req.body;
  const allowedRoles = ['user', 'delivery', 'admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  try {
    const hashed = await bcrypt.hash(password || 'password123', 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, role, phone, address) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role, phone',
      [name, email, hashed, role, phone || null, address || null]
    );
    res.status(201).json({ success: true, user: result.rows[0] });
  } catch (err) {
    
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Email already exists' });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const deleteUser = async (req, res) => {
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
  }
  try {
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const getProfile = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, address, created_at FROM users WHERE id=$1',
      [req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const updateProfile = async (req, res) => {
  const { name, phone, address } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name=$1, phone=$2, address=$3 WHERE id=$4 RETURNING id, name, email, role, phone, address',
      [name, phone, address, req.user.id]
    );
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getAllUsers, createUser, deleteUser, getProfile, updateProfile };
