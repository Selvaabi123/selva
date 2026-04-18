# Grocy-Mart Security API Documentation

## Base URL
```
/api/security
```

## Authentication
All endpoints require JWT authentication unless specified.
Admin-only endpoints require `role: 'admin'`.

---

## 1. Security Audit Logs

### GET /api/security/audit-logs
Get all security audit logs (Admin only)

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | int | Page number (default: 1) |
| limit | int | Items per page (default: 50) |
| type | string | Filter by event type |
| user_id | uuid | Filter by user |

**Response:**
```json
{
  "success": true,
  "logs": [
    {
      "id": 1,
      "event_type": "LOGIN_SUCCESS",
      "event_details": {},
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T00:00:00Z",
      "user_name": "John Doe",
      "user_email": "john@example.com"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 2
}
```

---

### GET /api/security/suspicious-activity
Get suspicious activity alerts (Admin only)

**Response:**
```json
{
  "success": true,
  "suspicious": {
    "failedLoginAttempts": [
      { "ip_address": "1.2.3.4", "attempts": 10 }
    ],
    "failed2FAAttempts": [],
    "codSpamPatterns": [],
    "rateLimitHits": []
  }
}
```

---

## 2. Rate Limit Status

### GET /api/security/rate-limit-status
Get current user's rate limit status

**Response:**
```json
{
  "success": true,
  "status": {
    "codOrders24h": {
      "used": 2,
      "limit": 5,
      "remaining": 3
    },
    "paymentAttempts24h": {
      "used": 1,
      "limit": 5,
      "remaining": 4
    }
  }
}
```

---

## 3. Session Management

### GET /api/security/sessions
Get all active sessions

**Response:**
```json
{
  "success": true,
  "sessions": [
    {
      "id": 1,
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T00:00:00Z",
      "last_used_at": "2024-01-01T12:00:00Z",
      "expires_at": "2024-01-08T00:00:00Z",
      "is_active": true
    }
  ],
  "total": 1
}
```

---

### DELETE /api/security/sessions/:id
Revoke a specific session

**Response:**
```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

---

### DELETE /api/security/sessions
Revoke all other sessions (except current)

**Response:**
```json
{
  "success": true,
  "message": "All other sessions revoked",
  "revokedCount": 3
}
```

---

## 4. Admin 2FA Management

### GET /api/security/admin-2fa/status
Get admin 2FA status

**Response:**
```json
{
  "success": true,
  "twoFactorEnabled": true,
  "phoneVerified": false,
  "emailVerified": false,
  "last2FAAt": "2024-01-01T00:00:00Z"
}
```

---

## 5. Security Score

### GET /api/security/score
Get user's security score

**Response:**
```json
{
  "success": true,
  "score": {
    "total": 85,
    "breakdown": {
      "passwordStrength": {
        "score": 20,
        "max": 20,
        "advice": "Use a strong password..."
      },
      "twoFactor": {
        "score": 30,
        "max": 30,
        "advice": "2FA is enabled"
      },
      "sessionManagement": {
        "score": 15,
        "max": 20,
        "advice": "1 active session(s)"
      },
      "recentActivity": {
        "score": 10,
        "max": 15,
        "advice": "5 successful logins this week"
      },
      "paymentMethodDiversity": {
        "score": 10,
        "max": 15,
        "advice": "Good balance of payment methods"
      }
    }
  }
}
```

---

## 6. Security Alerts

### GET /api/security/alerts
Get personalized security alerts

**Response:**
```json
{
  "success": true,
  "alerts": [
    {
      "type": "warning",
      "title": "Failed Login Attempts Detected",
      "message": "5 failed attempt(s) in the last 24 hours",
      "action": "Review your login history"
    },
    {
      "type": "info",
      "title": "Login from Multiple Locations",
      "message": "Logins detected from 2 different location(s)",
      "action": "Verify all devices"
    }
  ]
}
```

---

### POST /api/security/alerts/:id/dismiss
Dismiss an alert

**Response:**
```json
{
  "success": true,
  "message": "Alert dismissed"
}
```

---

## 7. Privacy Settings

### GET /api/security/privacy
Get privacy settings

**Response:**
```json
{
  "success": true,
  "privacy": {
    "share_location": true,
    "share_order_history": false,
    "marketing_emails": false
  }
}
```

---

### PUT /api/security/privacy
Update privacy settings

**Body:**
```json
{
  "shareLocation": false,
  "shareOrderHistory": true,
  "marketingEmails": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Privacy settings updated"
}
```

---

## 8. Data Export (GDPR)

### GET /api/security/export-data
Export all user data

**Response:**
```json
{
  "success": true,
  "data": {
    "exportedAt": "2024-01-01T00:00:00Z",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9999999999",
      "role": "user",
      "created_at": "2024-01-01T00:00:00Z"
    },
    "orders": [],
    "cartItems": [],
    "loginHistory": [],
    "totalOrders": 0
  }
}
```

---

### DELETE /api/security/delete-account
Request account deletion

**Body:**
```json
{
  "confirmEmail": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account deletion request received. You will receive a confirmation email.",
  "gracePeriod": "30 days"
}
```

---

## Event Types for Audit Logs

| Event Type | Description |
|------------|-------------|
| `LOGIN_SUCCESS` | Successful login |
| `LOGIN_FAILED` | Failed login attempt |
| `LOGOUT` | User logout |
| `2FA_SUCCESS` | 2FA verification successful |
| `2FA_FAILED` | 2FA verification failed |
| `2FA_LOCKED` | 2FA locked due to too many attempts |
| `TOKEN_REFRESH` | Token refreshed |
| `TOKEN_REVOKED` | Token revoked |
| `SESSION_REVOKED` | Session revoked by user |
| `ALL_SESSIONS_REVOKED` | All sessions revoked |
| `PRIVACY_SETTINGS_UPDATED` | Privacy settings changed |
| `DATA_EXPORT` | User data exported |
| `ACCOUNT_DELETION_REQUESTED` | Account deletion requested |
| `ADMIN_AUDIT_LOGS_ACCESSED` | Admin viewed audit logs |
| `SUSPICIOUS_ACTIVITY_VIEWED` | Admin viewed suspicious activity |
| `RATE_LIMIT_EXCEEDED` | User hit rate limit |
| `PASSWORD_CHANGE` | Password changed |
| `PASSWORD_RESET` | Password reset requested |

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Not logged in |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| All /security/* | 100 | 15 min |

---

## Notes

- All endpoints are logged to `security_audit_logs` table
- Admin endpoints automatically log admin access
- Suspicious activity triggers automatic alerts
- GDPR compliance built-in with export/delete features
