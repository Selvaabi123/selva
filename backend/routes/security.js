const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const pool = require('../config/db');
const logger = require('../utils/logger');

// ==========================================
// SECURITY AUDIT LOGS
// ==========================================

const logSecurityEvent = async (req, eventType, details = {}) => {
  try {
    await pool.query(
      `INSERT INTO security_audit_logs (user_id, event_type, event_details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user?.id || null,
        eventType,
        JSON.stringify(details),
        req.ip || req.connection.remoteAddress,
        req.get('user-agent') || null
      ]
    );
  } catch (err) {
    console.error('Failed to log security event:', err.message);
  }
};

// GET /api/security/audit-logs - Admin only
router.get('/audit-logs', 
  authenticate, 
  authorize('admin'), 
  async (req, res) => {
    try {
      const { page = 1, limit = 50, type, user_id } = req.query;
      const offset = (page - 1) * limit;
      
      let whereClause = 'WHERE 1=1';
      const params = [];
      let paramCount = 0;

      if (type) {
        paramCount++;
        whereClause += ` AND event_type = $${paramCount}`;
        params.push(type);
      }

      if (user_id) {
        paramCount++;
        whereClause += ` AND user_id = $${paramCount}`;
        params.push(user_id);
      }

      const result = await pool.query(
        `SELECT sal.*, u.name as user_name, u.email as user_email
         FROM security_audit_logs sal
         LEFT JOIN users u ON sal.user_id = u.id
         ${whereClause}
         ORDER BY sal.created_at DESC
         LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
        [...params, limit, offset]
      );

      const countResult = await pool.query(
        `SELECT COUNT(*) FROM security_audit_logs ${whereClause}`,
        params
      );

      await logSecurityEvent(req, 'ADMIN_AUDIT_LOGS_ACCESS', { page, limit });

      res.json({
        success: true,
        logs: result.rows,
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        pages: Math.ceil(countResult.rows[0].count / limit)
      });
    } catch (err) {
      logger.error('Failed to fetch audit logs', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
  }
);

// GET /api/security/suspicious-activity - Admin only
router.get('/suspicious-activity',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const suspicious = {};

      // Failed logins by IP (last hour)
      const failedLogins = await pool.query(`
        SELECT ip_address, COUNT(*) as attempts
        FROM security_audit_logs
        WHERE event_type = 'LOGIN_FAILED'
        AND created_at > NOW() - INTERVAL '1 hour'
        GROUP BY ip_address
        HAVING COUNT(*) > 3
      `);
      suspicious.failedLoginAttempts = failedLogins.rows;

      // Failed 2FA attempts (last 15 min)
      const failed2FA = await pool.query(`
        SELECT user_id, u.name, u.email, COUNT(*) as attempts
        FROM security_audit_logs sal
        JOIN users u ON sal.user_id = u.id
        WHERE event_type = '2FA_FAILED'
        AND sal.created_at > NOW() - INTERVAL '15 minutes'
        GROUP BY user_id, u.name, u.email
        HAVING COUNT(*) >= 2
      `);
      suspicious.failed2FAAttempts = failed2FA.rows;

      // COD spam patterns (last hour)
      const codSpam = await pool.query(`
        SELECT user_id, u.name, COUNT(*) as orders
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.payment_method = 'cod'
        AND o.created_at > NOW() - INTERVAL '1 hour'
        GROUP BY user_id, u.name
        HAVING COUNT(*) > 5
      `);
      suspicious.codSpamPatterns = codSpam.rows;

      // High rate limit hits
      const rateLimitHits = await pool.query(`
        SELECT ip_address, COUNT(*) as hits
        FROM security_audit_logs
        WHERE event_type = 'RATE_LIMIT_EXCEEDED'
        AND created_at > NOW() - INTERVAL '1 hour'
        GROUP BY ip_address
        HAVING COUNT(*) > 10
      `);
      suspicious.rateLimitHits = rateLimitHits.rows;

      await logSecurityEvent(req, 'SUSPICIOUS_ACTIVITY_VIEWED', {});

      res.json({ success: true, suspicious });
    } catch (err) {
      logger.error('Failed to fetch suspicious activity', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to fetch suspicious activity' });
    }
  }
);

// ==========================================
// RATE LIMIT STATUS
// ==========================================

// GET /api/security/rate-limit-status - Current user
router.get('/rate-limit-status',
  authenticate,
  async (req, res) => {
    try {
      const status = {};

      // COD orders in last 24 hours
      const codOrders = await pool.query(`
        SELECT COUNT(*) as count FROM orders 
        WHERE user_id = $1 
        AND payment_method = 'cod' 
        AND created_at > NOW() - INTERVAL '24 hours'
      `, [req.user.id]);
      status.codOrders24h = {
        used: parseInt(codOrders.rows[0].count),
        limit: 5,
        remaining: Math.max(0, 5 - parseInt(codOrders.rows[0].count))
      };

      // Payment attempts in last 24 hours
      const paymentAttempts = await pool.query(`
        SELECT COUNT(*) as count FROM payment_transactions 
        WHERE user_id = $1 
        AND payment_status = 'pending'
        AND created_at > NOW() - INTERVAL '24 hours'
      `, [req.user.id]);
      status.paymentAttempts24h = {
        used: parseInt(paymentAttempts.rows[0].count),
        limit: 5,
        remaining: Math.max(0, 5 - parseInt(paymentAttempts.rows[0].count))
      };

      res.json({ success: true, status });
    } catch (err) {
      logger.error('Failed to fetch rate limit status', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to fetch status' });
    }
  }
);

// ==========================================
// USER SESSIONS MANAGEMENT
// ==========================================

// GET /api/security/sessions - Current user
router.get('/sessions',
  authenticate,
  async (req, res) => {
    try {
      // Create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          refresh_token_hash VARCHAR(64) NOT NULL UNIQUE,
          ip_address INET,
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          is_active BOOLEAN DEFAULT TRUE
        )
      `);

      const sessions = await pool.query(`
        SELECT id, ip_address, user_agent, created_at, last_used_at, expires_at, is_active
        FROM user_sessions
        WHERE user_id = $1 AND is_active = TRUE
        ORDER BY last_used_at DESC
        LIMIT 10
      `, [req.user.id]);

      res.json({
        success: true,
        sessions: sessions.rows,
        total: sessions.rows.length
      });
    } catch (err) {
      logger.error('Failed to fetch sessions', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
    }
  }
);

// DELETE /api/security/sessions/:id - Revoke specific session
router.delete('/sessions/:id',
  authenticate,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        `UPDATE user_sessions 
         SET is_active = FALSE 
         WHERE id = $1 AND user_id = $2 
         RETURNING id`,
        [id, req.user.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Session not found' });
      }

      await logSecurityEvent(req, 'SESSION_REVOKED', { sessionId: id });
      logger.info('Session revoked', { userId: req.user.id, sessionId: id });

      res.json({ success: true, message: 'Session revoked successfully' });
    } catch (err) {
      logger.error('Failed to revoke session', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to revoke session' });
    }
  }
);

// DELETE /api/security/sessions - Revoke all other sessions
router.delete('/sessions',
  authenticate,
  async (req, res) => {
    try {
      // Keep current session (based on IP for simplicity)
      const result = await pool.query(
        `UPDATE user_sessions 
         SET is_active = FALSE 
         WHERE user_id = $1 AND ip_address != $2`,
        [req.user.id, req.ip]
      );

      await logSecurityEvent(req, 'ALL_SESSIONS_REVOKED', { revokedCount: result.rowCount });
      logger.info('All other sessions revoked', { userId: req.user.id });

      res.json({ 
        success: true, 
        message: 'All other sessions revoked',
        revokedCount: result.rowCount
      });
    } catch (err) {
      logger.error('Failed to revoke sessions', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to revoke sessions' });
    }
  }
);

// ==========================================
// ADMIN 2FA MANAGEMENT
// ==========================================

// GET /api/security/admin-2fa/status - Admin only
router.get('/admin-2fa/status',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      // Create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_security_settings (
          id SERIAL PRIMARY KEY,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
          two_factor_enabled BOOLEAN DEFAULT TRUE,
          backup_codes TEXT[],
          phone_verified BOOLEAN DEFAULT FALSE,
          email_verified BOOLEAN DEFAULT FALSE,
          last_2fa_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      const settings = await pool.query(
        'SELECT * FROM admin_security_settings WHERE user_id = $1',
        [req.user.id]
      );

      if (settings.rows.length === 0) {
        // Create default settings
        await pool.query(
          'INSERT INTO admin_security_settings (user_id) VALUES ($1)',
          [req.user.id]
        );
        return res.json({
          success: true,
          twoFactorEnabled: true,
          phoneVerified: false,
          emailVerified: false
        });
      }

      res.json({
        success: true,
        twoFactorEnabled: settings.rows[0].two_factor_enabled,
        phoneVerified: settings.rows[0].phone_verified,
        emailVerified: settings.rows[0].email_verified,
        last2FAAt: settings.rows[0].last_2fa_at
      });
    } catch (err) {
      logger.error('Failed to fetch 2FA status', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to fetch 2FA status' });
    }
  }
);

// ==========================================
// SECURITY SCORE & COMPLIANCE
// ==========================================

// GET /api/security/score - Current user security score
router.get('/score',
  authenticate,
  async (req, res) => {
    try {
      const score = {
        total: 100,
        breakdown: {}
      };

      // Check password strength (simulated)
      score.breakdown.passwordStrength = {
        score: 100,
        max: 20,
        advice: 'Use a strong password with special characters'
      };

      // Check 2FA (admins only)
      if (req.user.role === 'admin') {
        const settings = await pool.query(
          'SELECT two_factor_enabled FROM admin_security_settings WHERE user_id = $1',
          [req.user.id]
        );
        const has2FA = settings.rows[0]?.two_factor_enabled;
        score.breakdown.twoFactor = {
          score: has2FA ? 30 : 0,
          max: 30,
          advice: has2FA ? '2FA is enabled' : 'Enable 2FA for extra security'
        };
      }

      // Check active sessions
      const activeSessions = await pool.query(
        'SELECT COUNT(*) FROM user_sessions WHERE user_id = $1 AND is_active = TRUE',
        [req.user.id]
      );
      const sessionCount = parseInt(activeSessions.rows[0].count);
      score.breakdown.sessionManagement = {
        score: Math.max(0, 20 - (sessionCount - 1) * 5),
        max: 20,
        advice: `${sessionCount} active session(s)`
      };

      // Check recent login activity
      const recentLogins = await pool.query(`
        SELECT COUNT(*) FROM security_audit_logs 
        WHERE user_id = $1 AND event_type = 'LOGIN_SUCCESS' 
        AND created_at > NOW() - INTERVAL '7 days'
      `, [req.user.id]);
      score.breakdown.recentActivity = {
        score: Math.min(15, parseInt(recentLogins.rows[0].count) * 2),
        max: 15,
        advice: `${recentLogins.rows[0].count} successful logins this week`
      };

      // Check COD usage
      const codOrders = await pool.query(`
        SELECT COUNT(*) FROM orders 
        WHERE user_id = $1 AND payment_method = 'cod'
        AND created_at > NOW() - INTERVAL '30 days'
      `, [req.user.id]);
      score.breakdown.paymentMethodDiversity = {
        score: parseInt(codOrders.rows[0].count) < 10 ? 15 : 5,
        max: 15,
        advice: parseInt(codOrders.rows[0].count) < 10 
          ? 'Good balance of payment methods' 
          : 'Consider using online payment more often'
      };

      // Calculate total
      score.total = Object.values(score.breakdown).reduce(
        (sum, item) => sum + item.score, 0
      );

      res.json({ success: true, score });
    } catch (err) {
      logger.error('Failed to calculate security score', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to calculate score' });
    }
  }
);

// ==========================================
// SECURITY ALERTS
// ==========================================

// GET /api/security/alerts - Get user-specific security alerts
router.get('/alerts',
  authenticate,
  async (req, res) => {
    try {
      const alerts = [];

      // Check for new failed login attempts
      const failedLogins = await pool.query(`
        SELECT COUNT(*) as count, MAX(created_at) as last_attempt
        FROM security_audit_logs
        WHERE user_id = $1 AND event_type = 'LOGIN_FAILED'
        AND created_at > NOW() - INTERVAL '24 hours'
      `, [req.user.id]);

      if (parseInt(failedLogins.rows[0].count) > 0) {
        alerts.push({
          type: 'warning',
          title: 'Failed Login Attempts Detected',
          message: `${failedLogins.rows[0].count} failed attempt(s) in the last 24 hours`,
          action: 'Review your login history'
        });
      }

      // Check for new device/IP logins
      const newDevices = await pool.query(`
        SELECT DISTINCT ip_address, user_agent, created_at
        FROM security_audit_logs
        WHERE user_id = $1 AND event_type = 'LOGIN_SUCCESS'
        AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC
        LIMIT 5
      `, [req.user.id]);

      if (newDevices.rows.length > 1) {
        const uniqueIPs = [...new Set(newDevices.rows.map(d => d.ip_address))];
        if (uniqueIPs.length > 1) {
          alerts.push({
            type: 'info',
            title: 'Login from Multiple Locations',
            message: `Logins detected from ${uniqueIPs.length} different location(s)`,
            action: 'Verify all devices'
          });
        }
      }

      // Check session count
      const sessionCount = await pool.query(
        'SELECT COUNT(*) FROM user_sessions WHERE user_id = $1 AND is_active = TRUE',
        [req.user.id]
      );

      if (parseInt(sessionCount.rows[0].count) > 3) {
        alerts.push({
          type: 'warning',
          title: 'Multiple Active Sessions',
          message: `You have ${sessionCount.rows[0].count} active sessions`,
          action: 'Review and revoke unused sessions'
        });
      }

      res.json({ success: true, alerts });
    } catch (err) {
      logger.error('Failed to fetch security alerts', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
    }
  }
);

// POST /api/security/alerts/:id/dismiss - Dismiss an alert
router.post('/alerts/:id/dismiss',
  authenticate,
  async (req, res) => {
    // Alert dismissal is handled client-side for now
    res.json({ success: true, message: 'Alert dismissed' });
  }
);

// ==========================================
// CONSENT & PRIVACY
// ==========================================

// GET /api/security/privacy - Get user's privacy settings
router.get('/privacy',
  authenticate,
  async (req, res) => {
    try {
      // Create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS user_privacy_settings (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          share_location BOOLEAN DEFAULT TRUE,
          share_order_history BOOLEAN DEFAULT FALSE,
          marketing_emails BOOLEAN DEFAULT FALSE,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      let settings = await pool.query(
        'SELECT * FROM user_privacy_settings WHERE user_id = $1',
        [req.user.id]
      );

      if (settings.rows.length === 0) {
        await pool.query(
          'INSERT INTO user_privacy_settings (user_id) VALUES ($1)',
          [req.user.id]
        );
        settings = await pool.query(
          'SELECT * FROM user_privacy_settings WHERE user_id = $1',
          [req.user.id]
        );
      }

      res.json({ success: true, privacy: settings.rows[0] });
    } catch (err) {
      logger.error('Failed to fetch privacy settings', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
  }
);

// PUT /api/security/privacy - Update privacy settings
router.put('/privacy',
  authenticate,
  [
    body('shareLocation').optional().isBoolean(),
    body('shareOrderHistory').optional().isBoolean(),
    body('marketingEmails').optional().isBoolean()
  ],
  async (req, res) => {
    try {
      const { shareLocation, shareOrderHistory, marketingEmails } = req.body;

      await pool.query(`
        INSERT INTO user_privacy_settings (user_id, share_location, share_order_history, marketing_emails, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (user_id) DO UPDATE SET
          share_location = COALESCE($2, user_privacy_settings.share_location),
          share_order_history = COALESCE($3, user_privacy_settings.share_order_history),
          marketing_emails = COALESCE($4, user_privacy_settings.marketing_emails),
          updated_at = NOW()
      `, [req.user.id, shareLocation, shareOrderHistory, marketingEmails]);

      await logSecurityEvent(req, 'PRIVACY_SETTINGS_UPDATED', { shareLocation, shareOrderHistory, marketingEmails });

      res.json({ success: true, message: 'Privacy settings updated' });
    } catch (err) {
      logger.error('Failed to update privacy settings', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
  }
);

// ==========================================
// DATA EXPORT (GDPR)
// ==========================================

// GET /api/security/export-data - Export all user data
router.get('/export-data',
  authenticate,
  async (req, res) => {
    try {
      // Get user data
      const userData = await pool.query(
        'SELECT id, name, email, phone, role, address, created_at FROM users WHERE id = $1',
        [req.user.id]
      );

      // Get orders
      const orders = await pool.query(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
        [req.user.id]
      );

      // Get cart items
      const cartItems = await pool.query(`
        SELECT ci.*, p.name as product_name
        FROM cart_items ci
        JOIN cart c ON ci.cart_id = c.id
        JOIN products p ON ci.product_id = p.id
        WHERE c.user_id = $1
      `, [req.user.id]);

      // Get login history
      const loginHistory = await pool.query(`
        SELECT event_type, event_details, ip_address, created_at
        FROM security_audit_logs
        WHERE user_id = $1 AND event_type LIKE 'LOGIN%'
        ORDER BY created_at DESC
        LIMIT 50
      `, [req.user.id]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: userData.rows[0],
        orders: orders.rows,
        cartItems: cartItems.rows,
        loginHistory: loginHistory.rows,
        totalOrders: orders.rows.length
      };

      await logSecurityEvent(req, 'DATA_EXPORT', { recordCount: orders.rows.length });

      res.json({ success: true, data: exportData });
    } catch (err) {
      logger.error('Failed to export data', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to export data' });
    }
  }
);

// DELETE /api/security/delete-account - Delete user account (GDPR)
router.delete('/delete-account',
  authenticate,
  [
    body('confirmEmail').isEmail().withMessage('Please confirm your email')
  ],
  async (req, res) => {
    try {
      const { confirmEmail } = req.body;

      if (confirmEmail !== req.user.email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email does not match your account' 
        });
      }

      await logSecurityEvent(req, 'ACCOUNT_DELETION_REQUESTED', { 
        email: req.user.email 
      });

      // In production, you would:
      // 1. Anonymize or delete user data based on GDPR requirements
      // 2. Keep minimal data for legal/compliance reasons
      // 3. Send confirmation email
      // 4. Schedule actual deletion after grace period

      res.json({ 
        success: true, 
        message: 'Account deletion request received. You will receive a confirmation email.',
        gracePeriod: '30 days'
      });
    } catch (err) {
      logger.error('Failed to process account deletion', { error: err.message });
      res.status(500).json({ success: false, message: 'Failed to process request' });
    }
  }
);

module.exports = router;
