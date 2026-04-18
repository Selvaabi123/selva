const crypto = require('crypto');

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'default-csrf-secret-change-in-production';

const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashToken = (token) => {
  return crypto.createHmac('sha256', CSRF_SECRET).update(token).digest('hex');
};

const csrfCookieName = 'csrf_token';
const csrfHeaderName = 'x-csrf-token';

const generateTokenPair = () => {
  const token = generateCSRFToken();
  const hash = hashToken(token);
  return { token, hash };
};

const setCSRFCookie = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const { token, hash } = generateTokenPair();
    res.cookie(csrfCookieName, hash, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });
    res.setHeader('x-csrf-token', token);
    req.csrfToken = token;
  }
  next();
};

const validateCSRF = (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies?.[csrfCookieName];
  const headerToken = req.headers[csrfHeaderName];

  if (!cookieToken || !headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed: Missing token'
    });
  }

  const expectedHash = hashToken(headerToken);
  if (cookieToken !== expectedHash) {
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed: Invalid token'
    });
  }

  next();
};

module.exports = {
  setCSRFCookie,
  validateCSRF,
  generateTokenPair,
  csrfCookieName,
  csrfHeaderName
};
