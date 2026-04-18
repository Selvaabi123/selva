const Razorpay = require('razorpay');
const pool = require('../config/db');
const logger = require('../utils/logger');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXX',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'XXXXXXXXXXXXXXXXXX',
});

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_XXXXXXXX';

const MAX_PAYMENT_RETRIES = 5;
const PAYMENT_RETRY_WINDOW_HOURS = 24;

const checkPaymentRetries = async (userId) => {
  try {
    const result = await pool.query(`
      SELECT COUNT(*) as count FROM payment_transactions 
      WHERE user_id = $1 
        AND payment_status = 'pending'
        AND created_at > NOW() - INTERVAL '${PAYMENT_RETRY_WINDOW_HOURS} hours'
    `, [userId]);
    return parseInt(result.rows[0].count);
  } catch {
    return 0;
  }
};

const createOrder = async (req, res) => {
  const { amount, currency = 'INR', receipt } = req.body;

  const retryCount = await checkPaymentRetries(req.user.id);
  if (retryCount >= MAX_PAYMENT_RETRIES) {
    logger.warn('Payment retry limit exceeded', { userId: req.user.id, retries: retryCount });
    return res.status(429).json({ 
      success: false, 
      message: `Too many payment attempts. Please try again after ${PAYMENT_RETRY_WINDOW_HOURS} hours.`
    });
  }

  try {
    const options = {
      amount: Math.round(amount * 100),
      currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: {
        userId: req.user.id.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    await pool.query(
      `INSERT INTO payment_transactions (order_id, user_id, amount, payment_method, payment_status, transaction_id, razorpay_order_id)
       VALUES ($1, $2, $3, 'razorpay', 'pending', $4, $4)`,
      [null, req.user.id, amount, order.id]
    );

    res.json({
      success: true,
      order,
      key_id: RAZORPAY_KEY_ID,
    });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Payment order creation failed' });
  }
};

const verifyPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = req.body;

  try {
    const txn = await pool.query(
      `SELECT * FROM payment_transactions WHERE razorpay_order_id = $1`,
      [razorpay_order_id]
    );

    if (!txn.rows.length) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (txn.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const crypto = require('crypto');
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'XXXXXXXXXXXXXXXXXX')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      await pool.query(
        `UPDATE payment_transactions 
         SET payment_status = 'completed', gateway_response = $1, updated_at = CURRENT_TIMESTAMP
         WHERE razorpay_order_id = $2`,
        [JSON.stringify(req.body), razorpay_order_id]
      );

      res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Payment verification failed' });
  }
};

const getPaymentDetails = async (req, res) => {
  const { transaction_id } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM payment_transactions WHERE transaction_id = $1',
      [transaction_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (result.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    res.json({ success: true, payment: result.rows[0] });
  } catch (err) {
    
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

const getKey = async (req, res) => {
  res.json({ key: RAZORPAY_KEY_ID });
};

module.exports = { createOrder, verifyPayment, getPaymentDetails, getKey };
