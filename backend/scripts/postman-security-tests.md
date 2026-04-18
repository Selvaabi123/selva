# Grocy-Mart API Security Testing Plan
## Postman Collection for Penetration Testing

---

## SETUP INSTRUCTIONS

### 1. Create Environment Variables in Postman:
```
{{base_url}} = http://localhost:2005
{{user_token}} = <login as user>
{{admin_token}} = <login as admin>
{{delivery_token}} = <login as delivery>
```

### 2. Create 3 Users for Testing:
- **User A**: Regular user account
- **Admin**: Admin role account  
- **Delivery**: Delivery partner account

---

## TEST COLLECTION 1: AUTHENTICATION & AUTHORIZATION

### TEST 1.1: Auth Bypass - Missing Token
**Endpoint**: GET /api/auth/me
**Vulnerability**: Broken Authentication
**Steps**:
1. Send request WITHOUT Authorization header
2. Check if 401 is returned

**Expected**: `401 {"success":false,"message":"No token provided"}`
**Bug if**: Returns 200 with user data

---

### TEST 1.2: Auth Bypass - Invalid Token
**Endpoint**: GET /api/auth/me
**Vulnerability**: Broken Authentication
**Headers**:
```
Authorization: Bearer invalid_token_12345
```

**Expected**: `401 {"success":false,"message":"Invalid or expired token"}`
**Bug if**: Returns 200 with data

---

### TEST 1.3: Role Escalation - Normal User to Admin
**Endpoint**: PUT /api/users/profile
**Vulnerability**: Mass Assignment
**Body**:
```json
{
  "name": "Test User",
  "role": "admin",
  "phone": "9999999999"
}
```

**Expected**: Role should NOT change (only name/phone updated, role ignored)
**Bug if**: Your role becomes admin

---

### TEST 1.4: JWT Token in Cookie (Verify Secure Storage)
**Endpoint**: POST /api/auth/login
**Steps**:
1. Login with valid credentials
2. Check Response Headers for `Set-Cookie`
3. Verify token is httpOnly

**Expected**: `Set-Cookie: token=xxx; HttpOnly; SameSite=Strict`
**Bug if**: Token visible in response body or not httpOnly

---

### TEST 1.5: Logout Token Cleanup
**Endpoint**: POST /api/auth/logout
**Steps**:
1. Login, get token
2. Call logout
3. Try to use same token for /api/auth/me

**Expected**: Second request returns 401
**Bug if**: Token still valid after logout

---

## TEST COLLECTION 2: IDOR (Insecure Direct Object Reference)

### TEST 2.1: IDOR - Access Other User's Order
**Endpoint**: GET /api/orders/:id
**Vulnerability**: IDOR
**Steps**:
1. Login as User A
2. Try to access Order ID 1, 2, 3, etc.

**Expected**: 
- User A's orders: 200 OK
- Other users' orders: 403 Forbidden

**Bug if**: You can see any order by changing the ID

---

### TEST 2.2: IDOR - Access Admin Analytics
**Endpoint**: GET /api/orders/analytics
**Vulnerability**: Broken Access Control
**As User (non-admin)**:
```
Authorization: Bearer {{user_token}}
```

**Expected**: `403 {"success":false,"message":"Access denied: insufficient permissions"}`
**Bug if**: Returns 200 with admin analytics

---

### TEST 2.3: IDOR - Modify Another User's Order Rating
**Endpoint**: PUT /api/orders/:id/rate
**Vulnerability**: IDOR
**As User A**:
```json
{
  "rating": 5
}
```
**Target**: Try to rate Order ID 999 (belongs to User B)

**Expected**: `403 {"success":false,"message":"Order not found"}` or `404`
**Bug if**: Rating is accepted for another user's order

---

### TEST 2.4: IDOR - Access Delivery Partner's Orders
**Endpoint**: GET /api/delivery/orders
**As User (non-delivery)**:
```
Authorization: Bearer {{user_token}}
```

**Expected**: `403 {"success":false,"message":"Access denied"}`
**Bug if**: Returns delivery orders

---

### TEST 2.5: IDOR - Access Payment Details
**Endpoint**: GET /api/payment/:transaction_id
**Vulnerability**: IDOR
**As User A**:
Try to access: `/api/payment/txn_abc123` where txn_abc123 belongs to User B

**Expected**: `403 {"success":false,"message":"Unauthorized"}`
**Bug if**: Returns User B's payment details

---

## TEST COLLECTION 3: SQL INJECTION

### TEST 3.1: SQLi - Product Search
**Endpoint**: GET /api/products?search=
**Vulnerability**: SQL Injection
**Payloads to Test**:
```
' OR '1'='1
' OR 1=1 --
' UNION SELECT NULL--
' DROP TABLE users--
'; SELECT * FROM users WHERE '1'='1
```

**Expected**: Returns empty results or validation error
**Bug if**: Returns all users, database error, or unusual data

---

### TEST 3.2: SQLi - Order ID Parameter
**Endpoint**: GET /api/orders/1
**Payloads**:
```
1 OR 1=1
1' OR '1'='1
1; DROP TABLE orders--
```

**Expected**: 400/404 validation error or 403
**Bug if**: Returns all orders or database error

---

### TEST 3.3: SQLi - Category Filter
**Endpoint**: GET /api/products?category=
**Payload**:
```
1' UNION SELECT table_name FROM information_schema.tables--
```

**Expected**: Empty results or validation error
**Bug if**: Returns database schema information

---

### TEST 3.4: SQLi - Email Registration
**Endpoint**: POST /api/auth/register
**Body**:
```json
{
  "name": "Test",
  "email": "test@test.com'--",
  "password": "password123"
}
```

**Expected**: Either valid registration or SQL error
**Bug if**: Registers without password or with unusual behavior

---

## TEST COLLECTION 4: INPUT VALIDATION

### TEST 4.1: Negative Quantity - Order
**Endpoint**: POST /api/orders
**Body**:
```json
{
  "delivery_address": "Test Address",
  "payment_method": "cod"
}
```
(With negative quantity in cart first)

**Expected**: `400 {"success":false,"message":"Invalid quantity"}`
**Bug if**: Order created with negative quantity

---

### TEST 4.2: Zero Quantity - Cart
**Endpoint**: PUT /api/cart/update
**Body**:
```json
{
  "product_id": 1,
  "quantity": 0
}
```

**Expected**: `400 {"success":false,"message":"Quantity must be between 1 and 100"}`
**Bug if**: Cart updated to quantity 0

---

### TEST 4.3: Negative Quantity - Cart
**Endpoint**: PUT /api/cart/update
**Body**:
```json
{
  "product_id": 1,
  "quantity": -999
}
```

**Expected**: `400 Bad Request`
**Bug if**: Cart accepts negative quantity

---

### TEST 4.4: Quantity Over Limit
**Endpoint**: PUT /api/cart/update
**Body**:
```json
{
  "product_id": 1,
  "quantity": 99999
}
```

**Expected**: `400 {"success":false,"message":"Quantity must be between 1 and 100"}`
**Bug if**: Cart updated to 99999

---

### TEST 4.5: Invalid Payment Method
**Endpoint**: POST /api/orders
**Body**:
```json
{
  "delivery_address": "Test",
  "payment_method": "hacked"
}
```

**Expected**: Defaults to 'cod' or returns validation error
**Bug if**: Accepts invalid payment_method

---

### TEST 4.6: XSS in Order Notes
**Endpoint**: POST /api/orders
**Body**:
```json
{
  "delivery_address": "123 Main St",
  "notes": "<script>alert('XSS')</script>",
  "payment_method": "cod"
}
```

**Expected**: Notes sanitized/stripped, stored as text
**Bug if**: Script tag stored and rendered without escaping

---

### TEST 4.7: XSS in Address Field
**Endpoint**: PUT /api/users/profile
**Body**:
```json
{
  "address": "<img src=x onerror=alert('XSS')>",
  "name": "Test"
}
```

**Expected**: Address sanitized
**Bug if**: XSS payload stored and executable

---

## TEST COLLECTION 5: RATE LIMITING

### TEST 5.1: Brute Force - Login
**Endpoint**: POST /api/auth/login
**Vulnerability**: Insufficient Brute Force Protection
**Steps**:
1. Send 10+ rapid login attempts with wrong password

**Expected**: After 5 attempts, returns `429 {"success":false,"message":"Too many login attempts. Try again in 15 minutes."}`
**Bug if**: All attempts processed, no rate limiting

---

### TEST 5.2: Brute Force - Register
**Endpoint**: POST /api/auth/register
**Vulnerability**: Registration Brute Force
**Steps**:
1. Register 10 accounts rapidly with different emails

**Expected**: Rate limited after several attempts
**Bug if**: No limit on registrations

---

### TEST 5.3: API DOS - Large Request
**Endpoint**: POST /api/auth/register
**Body**:
```json
{
  "name": "A very long string that exceeds reasonable limits...",
  "email": "test@test.com",
  "password": "password123"
}
```

**Expected**: Request validated and truncated or rejected
**Bug if**: Server hangs or accepts huge payload

---

## TEST COLLECTION 6: PAYMENT SECURITY

### TEST 6.1: Payment Verification Bypass
**Endpoint**: POST /api/payment/verify
**Vulnerability**: Payment Manipulation
**Body**:
```json
{
  "razorpay_order_id": "order_fake123",
  "razorpay_payment_id": "pay_fake123",
  "razorpay_signature": "fake_signature"
}
```

**Expected**: `400 {"success":false,"message":"Invalid payment signature"}`
**Bug if**: Payment marked as completed

---

### TEST 6.2: Payment Verification - IDOR
**Endpoint**: POST /api/payment/verify
**Vulnerability**: IDOR
**Steps**:
1. Create order as User A
2. Try to verify payment for User B's order_id

**Expected**: `403 {"success":false,"message":"Unauthorized"}`
**Bug if**: Can verify other user's payment

---

### TEST 6.3: Access Payment Key Without Auth
**Endpoint**: GET /api/payment/key

**Expected**: Should work (public key is OK) or require minimal auth
**Bug if**: Returns sensitive data

---

## TEST COLLECTION 7: ERROR HANDLING

### TEST 7.1: Information Disclosure - Login
**Endpoint**: POST /api/auth/login
**Body**:
```json
{
  "email": "nonexistent@test.com",
  "password": "wrong"
}
```

**Expected**: `401 {"success":false,"message":"Invalid credentials"}`
**Bug if**: `401 {"success":false,"message":"User not found"}` or `Email not registered`

---

### TEST 7.2: Information Disclosure - User Enumeration
**Endpoint**: POST /api/auth/register
**Body**:
```json
{
  "email": "admin@grocymart.com",
  "password": "test123",
  "name": "Test"
}
```

**Expected**: Generic error or success message
**Bug if**: Reveals whether email is registered

---

### TEST 7.3: Stack Trace Exposure
**Endpoint**: GET /api/orders/invalid_id

**Expected**: `404 {"success":false,"message":"Order not found"}`
**Bug if**: Returns 500 with stack trace or database error

---

## TEST COLLECTION 8: OTP SECURITY

### TEST 8.1: OTP Verification - Wrong OTP
**Endpoint**: POST /api/delivery/verify-otp
**As Delivery Partner**:
```json
{
  "order_id": 1,
  "otp": "0000"
}
```

**Expected**: `400 {"success":false,"message":"Invalid OTP"}`
**Bug if**: Accepts any OTP

---

### TEST 8.2: OTP Not Required
**Endpoint**: PUT /api/delivery/update-status
**Body**:
```json
{
  "order_id": 1,
  "status": "delivered"
}
```

**Expected**: Should require OTP verification first
**Bug if**: Can mark as delivered without OTP

---

### TEST 8.3: OTP Brute Force
**Endpoint**: POST /api/delivery/verify-otp
**Vulnerability**: OTP Brute Force
**Steps**:
1. Try OTP 0000, 1111, 2222, ... 9999 rapidly

**Expected**: Rate limited or account locked after few attempts
**Bug if**: No limit on OTP attempts

---

## TEST COLLECTION 9: CORS CONFIGURATION

### TEST 9.1: Cross-Origin Request from Evil Domain
**Endpoint**: POST /api/auth/login
**Headers**:
```
Origin: https://evil-attacker.com
```

**Expected**: CORS error or request rejected
**Bug if**: 
- `Access-Control-Allow-Origin: https://evil-attacker.com`
- Or `Access-Control-Allow-Origin: *`

---

### TEST 9.2: Credentials Sent to Foreign Origin
**Endpoint**: POST /api/auth/login
**Headers**:
```
Origin: https://evil-attacker.com
Cookie: token=xxx
```

**Expected**: Request blocked by CORS
**Bug if**: Credentials sent to evil domain

---

## TEST COLLECTION 10: DELIVERY PARTNER SECURITY

### TEST 10.1: Status Update Without Ownership
**Endpoint**: PUT /api/delivery/update-status
**As User (not delivery partner)**:
```json
{
  "order_id": 1,
  "status": "delivered"
}
```

**Expected**: `403 {"success":false,"message":"Access denied"}`
**Bug if**: Status updated

---

### TEST 10.2: Update Another Partner's Order
**Endpoint**: PUT /api/delivery/update-status
**As Delivery Partner A**:
```json
{
  "order_id": 5,
  "status": "delivered"
}
```
Where Order 5 belongs to Delivery Partner B

**Expected**: `403 or 404`
**Bug if**: Can update any order's status

---

### TEST 10.3: Location Spoofing
**Endpoint**: PUT /api/delivery/update-location
**Body**:
```json
{
  "latitude": 90.0000,
  "longitude": 180.0000
}
```

**Expected**: Validated to reasonable bounds
**Bug if**: Accepts invalid coordinates

---

## QUICK TEST SCRIPTS (Postman Runner)

### Batch Test: All Protected Routes Without Token
Run this against all authenticated endpoints:
```
{{base_url}}/api/cart
{{base_url}}/api/orders/user
{{base_url}}/api/users/profile
{{base_url}}/api/admin/users
{{base_url}}/api/delivery/orders
```

**Expected**: All return 401

---

### Batch Test: Admin Routes as Regular User
Run with {{user_token}}:
```
{{base_url}}/api/admin/users
{{base_url}}/api/admin/orders
{{base_url}}/api/products (POST)
{{base_url}}/api/categories (POST)
```

**Expected**: All return 403

---

## SUCCESS CRITERIA

Your application is SECURE if:
- ✅ All auth bypass attempts return 401/403
- ✅ IDOR attempts return 403 for unauthorized access
- ✅ SQL injection payloads return sanitized results or errors
- ✅ Rate limiting kicks in after 5 failed login attempts
- ✅ Payment verification requires ownership
- ✅ OTP cannot be brute forced
- ✅ No stack traces in error responses
- ✅ CORS blocks foreign origins
- ✅ Input validation rejects negative/overlimit quantities
- ✅ No mass assignment vulnerabilities

---

## REPORT TEMPLATE

For each failed test, document:

```
TEST: [Name]
ENDPOINT: [URL]
PAYLOAD: [What you sent]
ACTUAL RESULT: [What server returned]
SEVERITY: [Critical/High/Medium/Low]
IMPACT: [What an attacker could do]
FIX: [How to remediate]
```
