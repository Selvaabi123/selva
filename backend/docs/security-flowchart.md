# Grocy-Mart Security & Architecture Flowcharts

> View this file in VS Code with **Markdown Preview Mermaid Support** extension
> Or open `flowcharts.html` in browser for live diagrams

---

## 1. Overall System Architecture

```mermaid
graph TB
    subgraph Frontends
        USER["👤 User App<br/>React + Vite"]
        ADMIN["🛠️ Admin Panel<br/>React + Vite"]
        DELIVERY["🚴 Delivery App<br/>React + Vite"]
    end
    
    subgraph Backend["⚡ Express API + Security Layers"]
        MID1["🔐 Helmet<br/>Security Headers"]
        MID2["⚡ Rate Limiting<br/>IP-based"]
        MID3["🔑 JWT Auth<br/>httpOnly Cookie"]
        MID4["🛡️ CSRF<br/>Double Submit"]
        MID5["📋 Access Control<br/>Role-based"]
    end
    
    subgraph Database
        DB[("🗄️ PostgreSQL")]
    end
    
    USER & ADMIN & DELIVERY -->|"HTTPS"| MID1
    MID1 --> MID2
    MID2 --> MID3
    MID3 --> MID4
    MID4 --> MID5
    MID5 --> DB
```

---

## 2. Authentication Flow (Updated)

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend
    participant B as Backend
    participant D as DB
    
    rect rgb(50, 50, 50)
        Note over U,B: Login Flow
        U->>F: Enter email/password
        F->>B: POST /api/auth/login
        B->>D: Validate credentials
        D-->>B: User data
        
        alt Admin User
            B->>B: Generate 2FA OTP
            B-->>F: require2FA: true
            F->>U: Enter OTP
            F->>B: POST /verify-2fa
            B->>B: Validate OTP
        end
        
        B->>B: Generate JWT + Refresh Token
        B-->>F: Set httpOnly cookie + Refresh Token
        F-->>U: Login success
    end
    
    rect rgb(0, 50, 0)
        Note over U,B: Token Refresh
        F->>B: POST /api/auth/refresh
        B->>B: Validate Refresh Token
        B->>B: Generate New JWT
        B-->>F: New Tokens
    end
    
    rect rgb(50, 0, 0)
        Note over U,B: Logout
        F->>B: POST /api/auth/logout
        B->>B: Add to Blacklist
        B->>B: Clear Cookie
        B-->>F: Logged out
    end
```

---

## 3. Order Placement Flow (Updated)

```mermaid
flowchart LR
    A["🛒 Cart"] --> B{Items?}
    B -->|Yes| C[Checkout]
    B -->|No| D[Empty]
    
    C --> E[Select Address]
    E --> F[Select Payment]
    F --> G{Payment Method?}
    
    G -->|COD| H{Check COD Limit?}
    G -->|Online| I[Razorpay]
    
    H -->|"< 5 orders<br/>24hrs"| H1[Create Order]
    H -->|"≥ 5 orders"| H2["❌ Blocked<br/>COD Limit Reached"]
    
    I --> J[Verify Payment]
    J -->|Success| H1
    J -->|Fail| K["❌ Payment Failed<br/>Retry Limit Check"]
    
    H1 --> L[Generate OTP]
    L --> M[Assign Driver]
    M --> N["✅ Order Confirmed"]
    
    N --> O[Driver Picked Up]
    O --> P[Out for Delivery]
    P --> Q[OTP Verification]
    Q --> R["✅ Delivered"]
    
    style R fill:#22c55e,color:#fff
    style K fill:#ef4444,color:#fff
    style H2 fill:#ef4444,color:#fff
```

---

## 4. Security Middleware Flow (Updated - FIXED!)

```mermaid
flowchart TD
    subgraph Layer1["Layer 1: Network"]
        A[Incoming Request] --> A1[HTTPS Check]
        A1 -->|"Invalid"| A2["❌ Reject"]
    end
    
    subgraph Layer2["Layer 2: Rate Limiting"]
        A2 -->|"Valid"| B[Rate Limit Check]
        B -->|"Exceeded"| B1["❌ 429 Too Many Requests"]
        B -->|"OK"| C[Continue]
    end
    
    subgraph Layer3["Layer 3: Authentication"]
        C --> D[JWT Validation]
        D -->|"Invalid/Blacklisted"| D1["❌ 401 Unauthorized"]
        D -->|"Valid"| E[Role Check]
        E -->|"Forbidden"| E1["❌ 403 Access Denied"]
        E -->|"OK"| F[Continue]
    end
    
    subgraph Layer4["Layer 4: CSRF (POST/PUT/DELETE)"]
        F --> G{Method?}
        G -->|GET/HEAD| H["✓ Skip CSRF"]
        G -->|POST/PUT<br/>DELETE/PATCH| I[CSRF Check]
        I -->|"Invalid"| I1["❌ 403 CSRF Error"]
        I -->|"Valid"| H
    end
    
    subgraph Layer5["Layer 5: Business Logic"]
        H --> J[Input Validation]
        J --> K[XSS Sanitize]
        K --> L[Process Request]
    end
    
    style B1 fill:#ef4444,color:#fff
    style D1 fill:#ef4444,color:#fff
    style E1 fill:#ef4444,color:#fff
    style I1 fill:#ef4444,color:#fff
    style L fill:#22c55e,color:#fff
```

---

## 5. JWT Blacklist (Logout)

```mermaid
flowchart TD
    A[User Clicks Logout] --> B[Get Current Token]
    B --> C[Add to Blacklist<br/>TTL = Token Expiry]
    C --> D[Clear httpOnly Cookie]
    D --> E[Return Success]
    
    subgraph "Next Requests"
        F[New Request] --> G{Token in Cookie?}
        G -->|Yes| H[Check Blacklist]
        H -->|Blacklisted| I["❌ 401 Revoked"]
        H -->|Valid| J["✓ Continue"]
    end
    
    subgraph Background
        K[Cleanup Job] --> L{Remove Expired?}
        L -->|Yes| M[Remove from Blacklist]
    end
    
    style I fill:#ef4444,color:#fff
    style J fill:#22c55e,color:#fff
```

---

## 6. Admin 2FA Flow

```mermaid
sequenceDiagram
    participant A as 🛠️ Admin
    participant F as Frontend
    participant B as Backend
    
    A->>F: Enter email/password
    F->>B: POST /api/auth/login
    
    alt Credentials Invalid
        B-->>F: 401 Invalid Credentials
        F-->>A: Show Error
    end
    
    alt Credentials Valid + Admin
        B->>B: Generate 6-digit OTP
        B->>B: Store pending 2FA
        B-->>F: require2FA: true
        F-->>A: Enter OTP Screen
        A->>F: Enter OTP
        F->>B: POST /api/auth/verify-2fa
        
        alt OTP Invalid
            B->>B: Increment Attempts
            alt 3 Failed Attempts
                B-->>F: 429 Locked
                F-->>A: Locked for 15 min
            else < 3 Attempts
                B-->>F: 400 Invalid OTP
                F-->>A: Try Again
            end
        end
        
        alt OTP Valid
            B->>B: Clear Attempts
            B->>B: Generate JWT + Refresh
            B-->>F: Success + Tokens
            F-->>A: Dashboard
        end
    end
    
    alt Credentials Valid + Not Admin
        B->>B: Generate JWT + Refresh
        B-->>F: Success + Tokens
        F-->>A: Dashboard (No 2FA)
    end
```

---

## 7. OTP Verification Security

```mermaid
flowchart TD
    A[Driver at Door] --> B[Ask Customer OTP]
    B --> C[Driver Enters OTP]
    C --> D{"Attempts < 3?"}
    
    D -->|Yes| E[Send Verify Request]
    E --> F{OTP Match?}
    
    F -->|Wrong| G[Attempts++]
    G --> D
    
    F -->|Correct| H["✅ Order Delivered<br/>Attempts Cleared"]
    
    D -->|No (≥3)| I["❌ Locked 15 min<br/>Notify Customer"]
    
    style H fill:#22c55e,color:#fff
    style I fill:#ef4444,color:#fff
```

---

## 8. COD Order Spam Protection

```mermaid
flowchart TD
    A[COD Order Request] --> B[Check Recent COD Orders]
    B --> C{"< 5 in 24hrs?"}
    
    C -->|Yes| D[Create Order]
    C -->|No| E["❌ Blocked<br/>COD Limit Reached"]
    
    D --> F[Order Created]
    F --> G[Update Counter]
    
    subgraph Daily Cleanup
        H[Midnight Cron] --> I[Reset/Archive]
    end
    
    style E fill:#ef4444,color:#fff
    style F fill:#22c55e,color:#fff
```

---

## 9. Payment Retry Limits

```mermaid
flowchart TD
    A[Payment Attempt] --> B[Check Retry Count]
    B --> C{"< 5 in 24hrs?"}
    
    C -->|Yes| D[Create Razorpay Order]
    D --> E[Open Payment Modal]
    E --> F{Result?}
    
    F -->|Success| G["✅ Payment Complete"]
    F -->|Failed| H[Increment Counter]
    H --> C
    
    C -->|No| I["❌ Too Many Attempts<br/>Try After 24hrs"]
    
    style G fill:#22c55e,color:#fff
    style I fill:#ef4444,color:#fff
```

---

## 10. Refresh Token Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as Frontend
    participant B as Backend
    
    Note over U,B: Access Token Expires (1 hour)
    
    U->>F: Access Expired
    F->>B: POST /api/auth/refresh<br/>with Refresh Token
    
    alt Refresh Valid
        B->>B: Validate Refresh Token
        B->>B: Revoke Old Refresh
        B->>B: Generate New Access + Refresh
        B-->>F: New Tokens
        F->>F: Update Stored Tokens
        F-->>U: Continue Seamless
    else Refresh Expired/Invalid
        B-->>F: 401 Unauthorized
        F-->>U: Please Login
    end
```

---

## 11. Security Checklist (Updated)

```mermaid
mindmap
  root(("🔒 Security"))
    Authentication
      httpOnly Cookies ✅
      JWT Blacklist ✅
      JWT Validation ✅
      Admin 2FA ✅
      Refresh Token ✅
      Role-based Access ✅
    Input Validation
      XSS Prevention ✅
      SQL Injection ✅
      Rate Limiting ✅
    CSRF Protection ✅
    Spam Protection
      COD Order Limit ✅
      Payment Retry Limit ✅
      OTP Brute Force ✅
    Payment Security
      Server Verification ✅
      Signature Validation ✅
    Data Protection
      Input Sanitization ✅
      Output Encoding ✅
      Secure Logging ✅
```

---

## 12. API Security Layers (Updated)

```mermaid
flowchart LR
    subgraph L1["Network"]
        N1[HTTPS/TLS]
    end
    
    subgraph L2["Transport"]
        N2[CORS Origins]
        N2 --> N3[Helmet Headers]
    end
    
    subgraph L3["Rate Limit"]
        N3 --> N4[IP-based Limits]
        N4 --> N5[User-based Limits]
    end
    
    subgraph L4["Auth"]
        N5 --> N6[JWT Validation]
        N6 --> N7[Blacklist Check]
        N7 --> N8[Role Authorization]
    end
    
    subgraph L5["Request"]
        N8 --> N9[CSRF Validation]
        N9 --> N10[Input Validation]
    end
    
    subgraph L6["Output"]
        N10 --> N11[XSS Sanitize]
        N11 --> N12[SQL Safe Queries]
    end
    
    L1 --> L2 --> L3 --> L4 --> L5 --> L6
    
    N12 --> FINAL["✅ Secure"]
    
    style FINAL fill:#22c55e,color:#fff
```

---

## 13. Complete Request Flow

```mermaid
sequenceDiagram
    participant C as 👤 Client
    participant M as Middleware
    participant A as Auth
    participant R as Route
    
    C->>M: HTTP Request
    M->>M: Helmet Headers
    M->>M: CORS Check
    M->>M: Rate Limit Check
    
    alt Rate Limited
        M-->>C: 429 Too Many
    else OK
        M->>A: JWT Check
        
        alt Invalid/Blacklisted
            A-->>C: 401 Unauthorized
        else Valid
            A->>A: Role Check
            
            alt Forbidden
                A-->>C: 403 Access Denied
            else OK
                alt POST/PUT/DELETE
                    A->>A: CSRF Check
                    
                    alt CSRF Invalid
                        A-->>C: 403 CSRF Error
                    end
                end
                
                A->>R: Request + User Context
                R->>R: Business Logic
                R->>R: XSS Sanitize
                R->>R: SQL Safe Query
                R-->>C: Response
            end
        end
    end
```

---

## Security Score Comparison

```mermaid
flowchart LR
    subgraph Before
        B1["GET Routes - No Auth ❌"]
        B2["No JWT Blacklist ❌"]
        B3["No Admin 2FA ❌"]
        B4["No COD Limit ❌"]
        B5["No Payment Retry Limit ❌"]
    end
    
    subgraph After
        A1["GET Routes - Auth ✅"]
        A2["JWT Blacklist ✅"]
        A3["Admin 2FA ✅"]
        A4["COD Limit (5/24hr) ✅"]
        A5["Payment Retry (5/24hr) ✅"]
    end
    
    B1 & B2 & B3 & B4 & B5 -->|Fix| A1 & A2 & A3 & A4 & A5
    
    subgraph Score
        S1["7.5/10"] -->|"All Fixes"| S2["9.5/10"]
    end
```

---

## Quick Reference - Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | self | XSS Protection |
| X-Content-Type-Options | nosniff | MIME Sniffing |
| SameSite | Strict | CSRF Protection |
| httpOnly | true | XSS Cookie Theft |
| Secure | Production | HTTPS Only |
| X-Frame-Options | DENY | Clickjacking |

---

## Quick Reference - Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Auth Login | 5 | 15 min |
| Auth Register | 5 | 15 min |
| API General | 100 | 15 min |
| OTP Verify | 3 | 15 min |
| COD Orders | 5 | 24 hours |
| Payment Retry | 5 | 24 hours |

---

**Status**: ✅ All Security Gaps Fixed!

- ✅ GET routes now have auth (via middleware)
- ✅ JWT Blacklist on logout
- ✅ Admin 2FA with OTP
- ✅ COD order spam protection (5/24hr)
- ✅ Payment retry limits (5/24hr)
- ✅ Refresh token mechanism
- ✅ CORS explicit origins (already done)
