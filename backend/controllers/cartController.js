const pool = require('../config/db');
const logger = require('../utils/logger');

const getOrCreateCart = async (userId) => {
  let result = await pool.query('SELECT id FROM cart WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await pool.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [userId]);
  }
  return result.rows[0].id;
};

const getCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    const result = await pool.query(
      `SELECT ci.id, ci.quantity, p.id AS product_id, p.name, p.price, p.image_url, p.stock
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = $1`,
      [cartId]
    );
    const items = result.rows;
    const total = items.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
    res.json({ success: true, items, total: total.toFixed(2) });
  } catch (err) {
    logger.error('Get cart failed', { error: err.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'Product ID required' });

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty < 1 || qty > 100) {
    return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 100' });
  }

  try {
    const prod = await pool.query('SELECT id, stock FROM products WHERE id = $1 AND is_available = true', [product_id]);
    if (prod.rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });

    const cartId = await getOrCreateCart(req.user.id);

    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3`,
      [cartId, product_id, quantity]
    );

    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    logger.error('Add to cart failed', { error: err.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const updateCartItem = async (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id || quantity === undefined) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  const qty = parseInt(quantity);
  if (isNaN(qty) || qty < 1 || qty > 100) {
    return res.status(400).json({ success: false, message: 'Quantity must be between 1 and 100' });
  }

  try {
    const cartId = await getOrCreateCart(req.user.id);
    if (qty <= 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, product_id]);
    } else {
      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
        [qty, cartId, product_id]
      );
    }
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    logger.error('Update cart failed', { error: err.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const removeFromCart = async (req, res) => {
  const { product_id } = req.body;
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, product_id]);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    logger.error('Remove from cart failed', { error: err.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const clearCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    logger.error('Clear cart failed', { error: err.message, userId: req.user?.id });
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
