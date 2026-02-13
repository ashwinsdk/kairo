# Kairo Services

Hyperlocal services marketplace MVP connecting customers with verified local vendors (electricians, plumbers, cleaners, etc.). Built with Angular 21, Express.js, and PostgreSQL.

## Architecture

- **Frontend**: Angular 21 (standalone components, signals, lazy-loaded routes)
- **Backend**: Express.js with JWT auth, Knex query builder, nodemailer (Brevo SMTP)
- **Database**: PostgreSQL 18 with 17 tables
- **Design**: Brutalist mobile-first theme, black background, teal gradient accents

## Project Structure

```
kairo/
  .env / .env.example     Environment config
  docker-compose.yml       PostgreSQL container
  package.json             Root orchestration scripts
  backend/
    src/
      index.js             Express entry point
      routes/              REST API endpoints
      services/            Auth, email, business logic
      utils/               Logger, errors, middleware, validation
    migrations/            Knex schema migrations
    seeds/                 Sample data
  frontend/
    src/
      app/
        auth/              Login, register, OTP verification
        customer/          Home, search, activity, profile, bookings, chat, addresses, notifications
        vendor/            Dashboard, bookings, job requests, earnings, profile
        admin/             Dashboard, KYC verification, user management, maintenance
        core/              Auth service, API service, guards, interceptors
        shared/            Toast container
      environments/        Dev/prod environment config
      styles/              Design tokens, motion tokens, global styles
```

## Prerequisites

- Node.js >= 20
- PostgreSQL 18 (local or Docker)
- npm >= 10

## Setup

### 1. Environment

Copy the example env file and fill in real values:

```bash
cp .env.example .env
```

Required variables:

| Variable | Description |
|----------|-------------|
| DB_HOST, DB_PORT, DB_USER, DB_NAME | PostgreSQL connection |
| JWT_SECRET | Secret for signing JWTs |
| SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_KEY | Brevo SMTP credentials |
| EMAIL_FROM | Sender email address |

### 2. Database

Option A -- Docker:

```bash
docker-compose up -d
```

Option B -- Local PostgreSQL:

```bash
createdb kairo
```

### 3. Backend

```bash
cd backend
npm install
npx knex migrate:latest
npx knex seed:run
npm run dev
```

Backend starts on http://localhost:3000. Health check: GET /api/health.

### 4. Frontend

```bash
cd frontend
npm install
npx ng serve
```

Frontend starts on http://localhost:4200.

## Test Accounts (from seed data)

| Email | Password | Role |
|-------|----------|------|
| admin@kairo.local | Password123 | admin |
| ashwin@kairo.local | Password123 | customer |
| raju@kairo.local | Password123 | vendor |
| priya@example.com | Password123 | vendor |
| suresh@example.com | Password123 | vendor |
| lakshmi@example.com | Password123 | vendor |
| ganesh@example.com | Password123 | vendor |

All vendor accounts have KYC status "verified" in seed data.

## API Overview

Base URL: `http://localhost:3000/api`

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register customer or vendor |
| POST | /auth/verify-otp | Verify email OTP |
| POST | /auth/login | Login with email + password |
| POST | /auth/refresh | Refresh access token |
| POST | /auth/logout | Logout (invalidate session) |

### Vendors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /vendors | List vendors (supports geo filter, category, search) |
| GET | /vendors/categories | List service categories |
| GET | /vendors/promoted | List promoted vendors |
| GET | /vendors/:id | Get vendor detail with services and reviews |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /bookings | Create a booking |
| GET | /bookings | List bookings (filterable by status) |
| GET | /bookings/:id | Get booking detail |
| PATCH | /bookings/:id/status | Update booking status |
| POST | /bookings/:id/verify-otp | Verify arrival OTP |
| PATCH | /bookings/:id/price | Update final price |
| POST | /bookings/:id/rate | Rate a completed booking |

### Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /chat/:bookingId | Get chat messages |
| POST | /chat/:bookingId/messages | Send a message |
| GET | /chat/:bookingId/poll?since= | Poll for new messages |

### Payments (Mock)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /payments | Process payment (90% success rate for online mock) |
| PATCH | /payments/:id/confirm | Confirm cash payment |
| GET | /payments/history | Payment history |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/dashboard | Dashboard KPIs |
| GET | /admin/kyc | KYC submissions list |
| PATCH | /admin/kyc/:vendorId | Approve/reject KYC |
| GET | /admin/users | User list with search and filters |
| PATCH | /admin/users/:id/block | Block/unblock user |
| PATCH | /admin/maintenance | Toggle maintenance mode |
| GET | /admin/actions | Admin audit log |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /profile | Get current user profile |
| PUT | /profile | Update profile |
| GET | /profile/addresses | List addresses |
| POST | /profile/addresses | Create address |
| GET | /earnings | Vendor earnings summary |
| GET | /notifications | User notifications |
| GET | /health | Health check |

## Runbook

### Run migrations

```bash
cd backend && npx knex migrate:latest
```

### Seed database

```bash
cd backend && npx knex seed:run
```

### Revoke all sessions

Connect to the database and truncate the sessions table:

```sql
TRUNCATE TABLE sessions;
```

### Enable maintenance mode

```bash
curl -X PATCH http://localhost:3000/api/admin/maintenance \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

Or use the admin panel: navigate to /admin/maintenance and toggle the switch.

### Rollback last migration

```bash
cd backend && npx knex migrate:rollback
```

## Design Decisions

- **Mock payments only**: Payment flows simulate success (90%) and failure (10%) for online payments. Cash payments always succeed. UI labels indicate mock environment.
- **Polling for real-time**: Chat and booking updates use HTTP polling (3-second interval) instead of WebSockets. Architecture allows easy swap to SSE or WebSockets later.
- **JWT in localStorage**: Tokens stored in localStorage for simplicity in MVP. HttpOnly cookies recommended for production.
- **Haversine distance**: Vendor proximity calculated via SQL Haversine formula on lat/lng columns. PostGIS can be adopted later for better performance.
- **OTP via Brevo SMTP**: Real email delivery for OTP verification. OTPs are bcrypt-hashed, expire in 10 minutes, throttled to 3 per hour per user.
- **Brutalist design**: Black background (#000), teal gradient (linear-gradient(90deg, #00bfa6, #00796b)), Inter typeface, Source Code Pro for monospace. Single theme, no light mode.
- **Emoji-free policy**: Zero emojis in UI, docs, or code. All icons are inline SVGs (Lucide-style). Enforced via `npm run audit:emoji` pre-commit hook.
- **Motion-First system**: All animations use centralized motion tokens (`_motion.scss`). `prefers-reduced-motion` respected globally. Easing: `cubic-bezier(0.22, 1, 0.36, 1)`, durations: 120ms–420ms. Microinteraction utilities: `.btn-press`, `.card-hover`, `.list-entrance`, `.toast-slide`, `.modal-fade`.
- **Angular standalone components**: All components use standalone architecture with new @for/@if control flow syntax and signals for state management.

## Emoji Policy

This project enforces a **zero-emoji policy** across all user-facing surfaces, documentation, and code. All visual indicators use:

- **Inline SVG icons** for ratings (star), categories (Lucide-style tool icons), and navigation
- **Typographic treatments** for emphasis and hierarchy
- **CSS microinteractions** for visual feedback instead of decorative emoji

### Enforcement

| Layer | Mechanism |
|-------|-----------|
| Pre-commit | Husky runs `npm run audit:emoji` on every commit |
| Manual | `npm run audit:emoji` scans all source files |
| Script | `scripts/check-no-emojis.js` — exits 1 if emoji found |

### Rollback

To revert the emoji-free policy:
1. Remove the `audit:emoji` script from `package.json`
2. Delete `.husky/pre-commit` or remove the `audit:emoji` line
3. Delete `scripts/check-no-emojis.js`
4. Re-add emojis as desired in component templates

## Design Tokens

### Motion Tokens (`styles/_motion.scss`)

| Token | Value | Usage |
|-------|-------|-------|
| `$ease-primary` | `cubic-bezier(0.22, 1, 0.36, 1)` | Default easing for all transitions |
| `$ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Overshoot effects |
| `$duration-micro` | `120ms` | Button feedback, toggles |
| `$duration-small` | `200ms` | Tooltips, dropdowns |
| `$duration-medium` | `350ms` | Page transitions |
| `$duration-entrance` | `260ms` | List/card entrance animations |

### Microinteraction Classes (`styles.scss`)

| Class | Effect |
|-------|--------|
| `.btn-press` | Scale to 0.97 on `:active` |
| `.card-hover` | Lift -4px on hover with shadow |
| `.list-entrance` | Staggered `fadeUp` per child (40ms intervals) |
| `.toast-slide` | Slide up entrance |
| `.modal-fade` | Scale-in with fade |
| `.animate-entrance` | Single element `fadeUp` |
| `.animate-entrance-{1..10}` | Staggered entrance (50ms intervals) |

All motion respects `prefers-reduced-motion: reduce` — animations collapse to 0.01ms.

## Changelog

| Date | Change |
|------|--------|
| 2026-02-14 | Emoji removal: replaced all 17 emoji occurrences with inline SVG icons. Added motion-first microinteraction system. Added emoji enforcement script + Husky pre-commit hook. |
| 2026-02-13 | Initial MVP: full backend (auth, vendors, bookings, chat, payments, admin, earnings, notifications, profile), database schema (17 tables), migrations, seed data. Angular frontend with auth module (login, register, OTP), customer module (home, search, activity, profile, vendor detail, booking form, booking detail, chat, address management, notifications), vendor module (dashboard, bookings, job requests, earnings, profile), admin module (dashboard, KYC verification, user management, maintenance). Brutalist mobile-first design with teal gradient accents. |
