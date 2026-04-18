const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { register, login, logout, getMe, verifyAdmin2FA, refreshAccessToken } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg }))
    });
  }
  next();
};

router.post('/register', [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6, max: 128 }).withMessage('Password must be 6-128 characters'),
], handleValidationErrors, register);

router.post('/login', [
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
], handleValidationErrors, login);

router.post('/verify-2fa', [
  body('email').trim().normalizeEmail().isEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
], handleValidationErrors, verifyAdmin2FA);

router.post('/refresh', [
  body('refreshToken').notEmpty().withMessage('Refresh token required'),
], handleValidationErrors, refreshAccessToken);

router.get('/me', authenticate, getMe);

router.post('/logout', authenticate, logout);

module.exports = router;
