# Broker App - Technical Overview

## Architecture

This broker app is built on Cloudflare Workers with:
- **Frontend**: Next.js 15 with App Router
- **Authentication**: OTP-based login via email (Resend)
- **User Database**: Cloudflare D1 (SQLite) for users, sessions, and OTPs
- **Receipts Database**: External PostgreSQL via Cloudflare Hyperdrive
- **Session Management**: JWT tokens in HTTP-only cookies
- **Actions**: Server actions pattern (no API routes)

## Project Structure

```
app/
├── actions/          # Server actions
│   ├── auth.ts      # Authentication actions
│   └── receipts.ts  # Receipt data actions
├── dashboard/       # Protected dashboard pages
│   ├── page.tsx
│   ├── dashboard-client.tsx
│   └── receipts/[id]/page.tsx
├── login/           # Login flow
│   ├── page.tsx
│   └── login-form.tsx
└── page.tsx         # Home page

src/
├── db/              # Database schemas and config
└── lib/             # Utility functions
    └── auth-utils.ts # Auth helper functions
```

## Database Structure

### D1 Database (Local to Cloudflare)
- `users`: Stores user accounts (email, name, company, role)
- `user_receipts`: Maps users to receipt IDs they can access
- `otps`: Temporary storage for one-time passwords
- `sessions`: Active user sessions

### PostgreSQL Database (Via Hyperdrive)
- External receipts table accessed through Hyperdrive connection
- Connection ID: `aae1a977e7a94a6db8088b4d6759296c`

## Authentication Flow

1. User enters email on login page
2. System generates 6-digit OTP and sends via Resend
3. User enters OTP to verify identity
4. System creates JWT session (7-day expiry) in HTTP-only cookie
5. Middleware protects `/dashboard/*` routes

## Key Pages & Server Actions

### Pages
- `GET /` - Home page with login link
- `GET /login` - Login page with OTP flow
- `GET /dashboard` - Protected dashboard showing receipts
- `GET /dashboard/receipts/[id]` - Receipt detail page

### Server Actions (in app/actions/)
- `sendOtpAction` - Sends OTP to email
- `verifyOtpAction` - Verifies OTP and creates session
- `logoutAction` - Clears session and redirects to login
- `getReceipts` - Fetches user's receipts from PostgreSQL
- `getReceiptDetails` - Fetches specific receipt details

## Development

```bash
# Install dependencies
npm install

# Run locally (default port 3000)
npm run dev

# Deploy to Cloudflare
npm run deploy
```

## Direct SQL Queries of Postgres DB on fly.io

```bash
# Query external PostgreSQL (receipts database)
source .env && PGPASSWORD=$FLY_DB_SUPERADMIN_PASSWORD psql -h localhost -p 5432 -U postgres -c "YOUR_QUERY"

# Query D1 database locally
npx wrangler d1 execute broker-app-db --local --command "YOUR_QUERY"

# Query D1 database remotely
npx wrangler d1 execute broker-app-db --remote --command "YOUR_QUERY"
```

## Environment Variables

### Production (Cloudflare Secrets)
- `RESEND_API_KEY`: API key for sending emails
- `JWT_SECRET`: Secret for signing JWT tokens

### Local Development (.dev.vars)
- Same as production secrets

### Build Time (.env)
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN`: API token with D1 permissions
- `WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE`: Local PostgreSQL connection
