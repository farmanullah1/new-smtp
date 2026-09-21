# Production Node.js SMTP Backend Application

A production-ready Node.js backend application featuring native **SMTP email delivery**, **Handlebars dynamic HTML email templating**, cryptographic **OTP verification**, and full user lifecycle operations (Signup, Email Verification, Login with 2FA, Password Reset, Email Change, Profile Management, and Resource CRUD).

---

## 🚀 Key Highlights

- **SMTP Delivery Engine**: Configured with Nodemailer and verified with Gmail SMTP.
- **Dynamic HTML Email Templates**: Styled with modern, responsive CSS inside a master `views/layouts/main.handlebars` layout.
- **Cryptographic OTP Security**: 6-digit numeric OTPs generated with `crypto.randomInt`, hashed using SHA-256 HMAC, rate-limited, with attempt limits and expiration tracking.
- **Multi-Instance Database Support**: Connects natively to Microsoft SQL Server (`newDatabaseHAiBro`) using Sequelize, with automatic fallback resilience to SQLite for local development.
- **Full Resource CRUD**: Complete RESTful CRUD API with pagination, text search (`q`), category/status/priority filtering, and ownership validation.
- **Interactive Email Previews**: Built-in visual catalog at `/api/v1/previews` allowing browser inspection of all 10 email templates.
- **Postman Ready**: Includes pre-configured collection and environment files with automatic token extraction and chaining scripts.

---

## 📁 Architecture & File Layout

```
new smtp/
├── .env                                         # Environment variables (SMTP, MSSQL, JWT, Port)
├── package.json                                 # Dependencies and scripts
├── server.js                                    # Express server entrypoint & diagnostic dashboard
├── src/
│   ├── config/
│   │   ├── constants.js                         # Application roles, OTP expiry, pagination limits
│   │   ├── database.js                          # Sequelize MSSQL connection (with SQLite fallback)
│   │   └── email.js                             # Nodemailer transporter initialization & verification
│   ├── models/
│   │   ├── index.js                             # Model registry & associations
│   │   ├── User.js                              # User schema (roles, verification status, 2FA)
│   │   ├── Otp.js                               # Hashed OTPs, attempts, purposes, and metadata
│   │   ├── LoginHistory.js                      # Audit log of sign-ins (IP, user agent, status)
│   │   └── Item.js                              # CRUD resource schema with ownership
│   ├── services/
│   │   ├── auth.service.js                      # Signup, verify, login, password reset, email change
│   │   ├── email.service.js                     # Handlebars compiler, caching, and Nodemailer dispatcher
│   │   ├── otp.service.js                       # Cryptographic OTP generation and constant-time validation
│   │   └── item.service.js                      # Paginated, filtered CRUD operations
│   ├── controllers/
│   │   ├── auth.controller.js                   # Auth endpoints
│   │   ├── user.controller.js                   # Profile, 2FA, password change, account deletion
│   │   ├── item.controller.js                   # Resource CRUD endpoints
│   │   ├── emailPreview.controller.js           # Live browser rendering of email templates
│   │   └── health.controller.js                 # Health checks and test email dispatcher
│   ├── middlewares/
│   │   ├── auth.middleware.js                   # JWT Bearer token authentication & RBAC
│   │   ├── rateLimiter.middleware.js            # express-rate-limit for auth & OTP
│   │   ├── validate.middleware.js               # Payload validation rules
│   │   └── error.middleware.js                  # Centralized error handler & 404
│   ├── routes/
│   │   ├── index.js                             # Central router mounted on /api/v1
│   │   ├── auth.routes.js                       # /api/v1/auth
│   │   ├── user.routes.js                       # /api/v1/users
│   │   ├── item.routes.js                       # /api/v1/items
│   │   └── test.routes.js                       # /api/v1/health & /api/v1/previews
│   └── views/
│       ├── layouts/
│       │   └── main.handlebars                  # Master responsive HTML email layout
│       └── emails/
│           ├── signup-verification.handlebars   # Verification code email
│           ├── welcome.handlebars               # Account activated welcome email
│           ├── login-alert.handlebars           # Sign-in security alert
│           ├── otp-verification.handlebars      # Generic 2FA / security code
│           ├── password-reset.handlebars        # Password reset code
│           ├── password-changed.handlebars      # Password changed notice
│           ├── email-change-request.handlebars  # Code sent to new email address
│           ├── email-changed-notice.handlebars  # Security notice sent to old address
│           ├── account-deleted.handlebars       # Account closure confirmation
│           └── test-email.handlebars            # Diagnostic test email
├── postman/
│   ├── SMTP_Backend_API.postman_collection.json # Ready-to-import Postman Collection
│   └── SMTP_Backend_Local.postman_environment.json # Postman Environment
└── test/
    └── integration.test.js                      # Automated end-to-end integration test runner
```

---

## ⚙️ Configuration (`.env`)

Copy `.env.example` to `.env` and fill in your own environment credentials:

```env
PORT=3000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# JWT Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# SMTP Email Configuration (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
MAIL_FROM="Your Company" <your_email@gmail.com>

# Microsoft SQL Server
SERVER=localhost
DATABASE=your_database_name
DB_USER=your_db_user
DB_PASS=your_db_password
DB_PORT=1433
```


---

## 🏃 Getting Started

### 1. Run the Application
```bash
npm start
```
Or with auto-restart on file change:
```bash
npm run dev
```

The server will start on `http://localhost:3000`.

### 2. Run Automated Integration Tests
```bash
npm test
```
The test suite executes 10 comprehensive tests covering database connectivity, SMTP verification, user signup, OTP verification, login, profile management, CRUD operations, password reset, and email change.

---

## 📬 Interactive Email Previews

You can preview all 10 responsive Handlebars email templates directly in your browser:

- Catalog Overview: [http://localhost:3000/api/v1/previews](http://localhost:3000/api/v1/previews)
- Signup Verification: [http://localhost:3000/api/v1/previews/signup-verification](http://localhost:3000/api/v1/previews/signup-verification)
- Welcome Email: [http://localhost:3000/api/v1/previews/welcome](http://localhost:3000/api/v1/previews/welcome)
- Login Alert: [http://localhost:3000/api/v1/previews/login-alert](http://localhost:3000/api/v1/previews/login-alert)
- OTP Verification: [http://localhost:3000/api/v1/previews/otp-verification](http://localhost:3000/api/v1/previews/otp-verification)
- Password Reset: [http://localhost:3000/api/v1/previews/password-reset](http://localhost:3000/api/v1/previews/password-reset)
- Password Changed: [http://localhost:3000/api/v1/previews/password-changed](http://localhost:3000/api/v1/previews/password-changed)
- Email Change Request: [http://localhost:3000/api/v1/previews/email-change-request](http://localhost:3000/api/v1/previews/email-change-request)
- Email Changed Notice: [http://localhost:3000/api/v1/previews/email-changed-notice](http://localhost:3000/api/v1/previews/email-changed-notice)
- Account Deleted: [http://localhost:3000/api/v1/previews/account-deleted](http://localhost:3000/api/v1/previews/account-deleted)
- SMTP Diagnostic Test: [http://localhost:3000/api/v1/previews/test-email](http://localhost:3000/api/v1/previews/test-email)

---

## 📮 Testing with Postman

1. Open Postman.
2. Click **Import** in the upper left.
3. Select `postman/SMTP_Backend_API.postman_collection.json`.
4. Select `postman/SMTP_Backend_Local.postman_environment.json`.
5. In the top-right environment dropdown, select **SMTP Backend Local Environment**.
6. The collection includes pre-request scripts and test assertions:
   - Signing up automatically extracts the debug OTP into `{{otpCode}}`.
   - Verifying the email or logging in automatically stores `{{accessToken}}` and `{{refreshToken}}`.
   - Creating an item automatically stores `{{itemId}}` for update and delete requests.

---

## 📡 API Reference

### Health & Diagnostics
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/` | Service root and visual dashboard | None |
| `GET` | `/api/v1/health` | System status, DB, and SMTP diagnostics | None |
| `POST` | `/api/v1/test-email` | Dispatches a live test email via SMTP | None |

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/signup` | Register new user; dispatches verification OTP | None |
| `POST` | `/verify-email` | Validates OTP, activates account, sends welcome email | None |
| `POST` | `/resend-otp` | Re-issues fresh verification OTP | None |
| `POST` | `/login` | Authenticates user, issues JWTs, sends login alert | None |
| `POST` | `/verify-login-2fa` | Validates 2FA code if user enabled two-factor | None |
| `POST` | `/forgot-password` | Dispatches password reset code | None |
| `POST` | `/verify-reset-otp` | Validates code and issues single-use reset token | None |
| `POST` | `/reset-password` | Resets password with code or reset token | None |
| `POST` | `/change-email/request` | Sends OTP to new email and alert to old email | Bearer Token |
| `POST` | `/change-email/verify` | Validates OTP and updates primary email | Bearer Token |
| `POST` | `/refresh-token` | Rotates access token using refresh token | None |
| `POST` | `/logout` | Invalidation endpoint | Bearer Token |

### User Profile (`/api/v1/users`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/me` | Get current authenticated user profile | Bearer Token |
| `PUT` | `/me` | Update profile fields (name, phone, bio, avatar) | Bearer Token |
| `PUT` | `/me/password` | Change password while logged in | Bearer Token |
| `POST` | `/me/2fa` | Enable/disable Two-Factor Authentication | Bearer Token |
| `GET` | `/me/logins` | Audit list of recent sign-ins | Bearer Token |
| `DELETE` | `/me` | Delete account permanently | Bearer Token |

### Resource CRUD (`/api/v1/items`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/` | Create a new item resource | Bearer Token |
| `GET` | `/` | List items (pagination, filters: `status`, `category`, `q`) | Bearer Token |
| `GET` | `/stats` | Aggregate item counts | Bearer Token |
| `GET` | `/:id` | Retrieve single item by ID | Bearer Token |
| `PUT` | `/:id` | Update item (ownership verified) | Bearer Token |
| `DELETE` | `/:id` | Delete item (ownership verified) | Bearer Token |
