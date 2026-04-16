const pool = require('../config/db');

// Helper: get or create cart for user
const getOrCreateCart = async (userId) => {
  let result = await pool.query('SELECT id FROM cart WHERE user_id = $1', [userId]);
  if (result.rows.length === 0) {
    result = await pool.query('INSERT INTO cart (user_id) VALUES ($1) RETURNING id', [userId]);
  }
  return result.rows[0].id;
};

// GET /api/cart
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
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// POST /api/cart/add
const addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'Product ID required' });

  try {
    // Check product exists
    const prod = await pool.query('SELECT id, stock FROM products WHERE id = $1 AND is_available = true', [product_id]);
    if (prod.rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found' });

    const cartId = await getOrCreateCart(req.user.id);

    // Upsert cart item
    await pool.query(
      `INSERT INTO cart_items (cart_id, product_id, quantity)
       VALUES ($1, $2, $3)
       ON CONFLICT (cart_id, product_id)
       DO UPDATE SET quantity = cart_items.quantity + $3`,
      [cartId, product_id, quantity]
    );

    res.json({ success: true, message: 'Added to cart' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/cart/update
const updateCartItem = async (req, res) => {
  const { product_id, quantity } = req.body;
  if (!product_id || quantity === undefined) return res.status(400).json({ success: false, message: 'Missing fields' });

  try {
    const cartId = await getOrCreateCart(req.user.id);
    if (quantity <= 0) {
      await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, product_id]);
    } else {
      await pool.query(
        'UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3',
        [quantity, cartId, product_id]
      );
    }
    res.json({ success: true, message: 'Cart updated' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/cart/remove
const removeFromCart = async (req, res) => {
  const { product_id } = req.body;
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, product_id]);
    res.json({ success: true, message: 'Item removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/cart/clear
const clearCart = async (req, res) => {
  try {
    const cartId = await getOrCreateCart(req.user.id);
    await pool.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    res.json({ success: true, message: 'Cart cleared' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
