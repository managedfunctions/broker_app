# Broker App

A broker application built with Next.js on Cloudflare Workers with D1 database and OTP authentication via email.

## Features

- 🚀 **Next.js 15** with App Router
- ☁️ **Cloudflare Workers** deployment using OpenNext
- 🗄️ **D1 Database** for user data and sessions
- 🔐 **OTP Authentication** via email using Resend
- 🔑 **JWT Session Management** with HTTP-only cookies
- 💾 **Drizzle ORM** for type-safe database queries
- 🎨 **Tailwind CSS** for styling
- 📝 **TypeScript** for type safety

## Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Cloudflare account with Workers enabled
- Resend account for sending emails
- PostgreSQL (optional, for Hyperdrive if using external database)

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/managedfunctions/broker_app.git
cd broker_app

# Install dependencies
npm install
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Copy the dev vars example
cp .dev.vars.example .dev.vars
```

Update `.env` with your credentials:
- `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token

Update `.dev.vars` with:
- `RESEND_API_KEY`: Your Resend API key for sending OTP emails

### 3. Create D1 Database

```bash
# Create a new D1 database
npx wrangler d1 create broker-app-db

# Note the database_id from the output
```

Update `wrangler.toml` with your database ID:
```toml
[[d1_databases]]
binding = "BROKER_DB"
database_name = "broker-app-db"
database_id = "your-database-id-here"
```

### 4. Run Database Migrations

```bash
# Apply migrations to local D1 database
npx wrangler d1 execute broker-app-db --local --file=./migrations/0001_create_tables.sql

# Apply migrations to remote D1 database
npx wrangler d1 execute broker-app-db --remote --file=./migrations/0001_create_tables.sql
```

### 5. Development

```bash
# Start the development server
npm run dev

# Open http://localhost:3002
```

### 6. Deploy to Cloudflare Workers

```bash
# Deploy to production
npm run deploy

# The app will be available at https://broker-app.your-subdomain.workers.dev
```

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   └── auth/         # Authentication endpoints
│   ├── dashboard/        # Protected dashboard page
│   ├── login/           # Login page
│   └── page.tsx         # Home page
├── src/
│   ├── db/              # Database schema and connection
│   ├── lib/             # Utility functions and auth logic
│   └── env.d.ts         # TypeScript environment types
├── migrations/          # D1 database migrations
├── wrangler.toml       # Cloudflare Workers configuration
└── middleware.ts       # Next.js middleware for auth
```

## Configuration

### Database Schema

The template includes these tables:
- `users` - Stores user information
- `broker_receipts` - Links users to receipt IDs (customize as needed)
- `otps` - Stores one-time passwords for authentication
- `sessions` - Manages user sessions

### Authentication Flow

1. User enters email on login page
2. System generates 6-digit OTP and sends via Resend
3. User enters OTP to verify
4. System creates session with JWT token in HTTP-only cookie
5. Middleware protects authenticated routes

### Customization

#### Add New Tables

1. Create a new migration file in `migrations/`
2. Update the Drizzle schema in `src/db/schema.ts`
3. Run migrations on both local and remote databases

#### Modify Authentication

- Update OTP expiry in `src/lib/auth.ts` (default: 10 minutes)
- Modify session duration in `src/lib/auth.ts` (default: 7 days)
- Customize email template in `src/lib/auth.ts`

#### Add Hyperdrive (Optional)

If you need to connect to an external PostgreSQL database:

1. Create a Hyperdrive configuration in Cloudflare dashboard
2. Add the configuration to `wrangler.toml`:

```toml
[[hyperdrive]]
binding = "HYPERDRIVE"
id = "your-hyperdrive-id"
```

## Environment Variables

### Production Secrets

Set these as Cloudflare Worker secrets:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put JWT_SECRET
```

### Local Development

Create `.dev.vars` file:

```
RESEND_API_KEY=re_your_api_key
JWT_SECRET=your-secret-key
```

## Troubleshooting

### Local Development Issues

If you encounter Hyperdrive connection errors during local development:

1. Ensure the environment variable is set in your npm script
2. Or use the provided `dev.sh` script: `./dev.sh`

### Database Connection Issues

- Verify your D1 database ID in `wrangler.toml`
- Ensure migrations have been applied
- Check that bindings match between code and configuration

### Authentication Issues

- Verify Resend API key is correctly set
- Check email delivery in Resend dashboard
- Ensure cookies are enabled in the browser

## Security Considerations

- Always use HTTPS in production
- Keep JWT_SECRET secure and rotate regularly
- Implement rate limiting for OTP requests
- Add CSRF protection for production use
- Consider adding additional authentication factors

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.