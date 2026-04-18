const pool = require('../config/db');
const logger = require('../utils/logger');

const getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json({ success: true, categories: result.rows });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const createCategory = async (req, res) => {
  const { name, image_url } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  try {
    const result = await pool.query(
      'INSERT INTO categories (name, image_url) VALUES ($1, $2) RETURNING *',
      [name, image_url || null]
    );
    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (err) {
    
    if (err.code === '23505') return res.status(409).json({ success: false, message: 'Category already exists' });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const updateCategory = async (req, res) => {
  const { name, image_url } = req.body;
  try {
    const result = await pool.query(
      'UPDATE categories SET name=$1, image_url=$2 WHERE id=$3 RETURNING *',
      [name, image_url || null, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, category: result.rows[0] });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const deleteCategory = async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
