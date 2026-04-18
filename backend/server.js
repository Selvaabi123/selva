require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const securityRoutes = require('./routes/security');
const { cartRouter, ordersRouter, deliveryRouter, categoriesRouter, usersRouter, paymentRouter } = require('./routes/index');
const { setCSRFCookie, validateCSRF } = require('./middleware/csrf');

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware - Enhanced Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  permissionsPolicy: {
    geolocation: [],
    microphone: [],
    camera: []
  }
}));

// Rate Limiting
const isDev = process.env.NODE_ENV !== 'production';
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 10000 : 500, // Much higher limit in development
  message: { success: false, message: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 100 : 5, // 5 attempts in production
  message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.ip + ':' + req.body.email;
  },
  skip: (req) => {
    return isDev;
  }
});

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005',
      'http://localhost:3006',
      'http://localhost:3007',
      'http://localhost:3008',
      'http://localhost:3009',
      'http://localhost:3010',
      'http://localhost:3011',
      'http://localhost:3012',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:3004',
      'http://127.0.0.1:3005',
      'http://127.0.0.1:3006',
      'http://127.0.0.1:3007',
      'http://127.0.0.1:3008',
      'http://127.0.0.1:3009',
      'http://127.0.0.1:3010',
      'http://127.0.0.1:3011',
      'http://127.0.0.1:3012',
    ];
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

// Cookie parser for JWT cookies
app.use(cookieParser());

// Body Parsers with size limits
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// CSRF Protection - Set cookie for safe methods
app.use(setCSRFCookie);

// Static uploads - with security headers
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, filePath) => {
    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

// Root route
app.get('/', (req, res) => {
  res.json({ success: true, message: 'API is running...', timestamp: new Date().toISOString() });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Grocy-Mart API is running 🍕', timestamp: new Date().toISOString() });
});

// Apply general rate limiting
app.use('/api/', limiter);

// CSRF validation for state-changing methods (applied before routes)
app.use('/api/', (req, res, next) => {
  if (isDev) return next(); // Skip CSRF in development
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    return validateCSRF(req, res, next);
  }
  next();
});

// Routes - with auth rate limiting
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/delivery', deliveryRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/payment', paymentRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler - don't expose internal errors
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  
  // Don't expose internal error details to clients
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 
    ? 'Internal server error' 
    : err.message || 'An error occurred';
  
  res.status(statusCode).json({ 
    success: false, 
    message: message,
    // Only include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Grocy-Mart server running on http://localhost:${PORT}`);
  console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Security: Helmet + Rate Limiting enabled`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});