const pool = require('../config/db');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const getProducts = async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  let query = `
    SELECT p.*, c.name AS category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE p.is_available = true
  `;
  const params = [];
  let idx = 1;

  if (category) {
    query += ` AND p.category_id = $${idx++}`;
    params.push(category);
  }
  if (search) {
    query += ` AND (p.name ILIKE $${idx++} OR p.description ILIKE $${idx-1})`;
    params.push(`%${search}%`);
  }

  const countQuery = query.replace('SELECT p.*, c.name AS category_name', 'SELECT COUNT(*)');
  const countResult = await pool.query(countQuery, params);
  const total = parseInt(countResult.rows[0].count);

  query += ` ORDER BY p.created_at DESC LIMIT $${idx++} OFFSET $${idx}`;
  params.push(limit, offset);

  try {
    const result = await pool.query(query, params);
    res.json({ success: true, products: result.rows, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const getProduct = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const createProduct = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, description, price, category_id, image_url, stock } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, category_id, image_url, stock) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, description, price, category_id || null, image_url || null, stock || 0]
    );
    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const updateProduct = async (req, res) => {
  const { name, description, price, category_id, image_url, stock, is_available } = req.body;
  try {
    const result = await pool.query(
      `UPDATE products SET name=$1, description=$2, price=$3, category_id=$4, image_url=$5, stock=$6, is_available=$7 
       WHERE id=$8 RETURNING *`,
      [name, description, price, category_id ? parseInt(category_id) : null, image_url, stock, is_available ?? true, req.params.id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: result.rows[0] });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM products WHERE id=$1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const getAllProductsAdmin = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC'
    );
    res.json({ success: true, products: result.rows });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct, getAllProductsAdmin };
