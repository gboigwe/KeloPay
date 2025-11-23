# KeloPay - Crypto-to-Fiat Payment Platform

A Next.js 16 full-stack application that enables crypto-to-fiat conversions and merchant payments with real-time analytics.

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL 16 (Neon recommended)
- **Authentication**: NextAuth.js with SIWE (Sign-In with Ethereum)
- **Wallet Integration**: Reown AppKit (formerly WalletConnect)
- **Blockchain**: Wagmi + Ethers.js (Ethereum, Base, Arbitrum, Lisk, BSC)
- **State Management**: TanStack React Query

## Features

- 🔐 Wallet-based authentication via Reown AppKit
- 📊 Real-time analytics dashboard with KPIs
- 💸 Transaction history with filtering and pagination
- 👥 Role-based access control (Admin, Operations, Growth, Merchant, User)
- 📈 Analytics for users, conversions, and merchant performance
- 📄 Report generation and export
- 🌐 Multi-network support (5 mainnets + testnets)

---

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL database (Neon, Supabase, or local)
- Reown Project ID ([get one here](https://cloud.reown.com))

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Bandwidth-Labs/KeloPay.git
cd KeloPay/client
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Update `.env` with your credentials:

```env
# Database (Neon PostgreSQL recommended)
DATABASE_URL="postgresql://user:password@host:5432/kelopay?sslmode=require"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"  # Generate with: openssl rand -base64 32

# Reown AppKit (Required)
NEXT_PUBLIC_PROJECT_ID="your-reown-project-id"

# Environment
NEXT_PUBLIC_ENVIRONMENT="testnet"
```

### 4. Set Up Database

#### Initialize Prisma

```bash
# Generate Prisma client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init
```

#### Seed Test Data (Optional)

```bash
npm run db:seed
```

This creates:
- 9 test users (Admin, Operations, Growth, Merchant, 5 regular users)
- 50 sample transactions across all networks

---

## Running the Application

### Development Mode

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm start
```

---

## API Endpoints

### Analytics

- **GET** `/api/analytics/overview` - Dashboard summary data
  - Query params: `daysBack=30`, `granularity=daily`

### Transactions

- **GET** `/api/transactions` - Paginated transaction history
  - Query params: `page=1`, `limit=20`, `type`, `status`, `network`

### User

- **GET** `/api/user?address=0x...` - Get user by wallet address
- **POST** `/api/user` - Create or update user
  - Body: `{ walletAddress, email?, socialProvider? }`

### Webhooks

- **POST** `/api/webhooks/alchemy` - Receive blockchain transaction events
  - Headers: `x-alchemy-signature` (for verification)
  - Automatically processes and stores transactions from Alchemy

---

## Database Commands

```bash
# Run migrations
npm run db:migrate

# Push schema changes (without migrations)
npm run db:push

# Seed database with test data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

---

## Blockchain Transaction Indexing

### Setting Up Alchemy Webhooks

KeloPay uses Alchemy to monitor blockchain transactions in real-time.

#### 1. Create Alchemy Account
- Go to [alchemy.com](https://www.alchemy.com)
- Create a free account
- Create apps for each network (Ethereum, Base, Arbitrum, etc.)

#### 2. Get API Key
- Copy your Alchemy API key
- Add to `.env`:
  ```env
  NEXT_PUBLIC_ALCHEMY_API_KEY="your-api-key-here"
  ```

#### 3. Configure Webhooks
For each network:
1. Go to Alchemy Dashboard → Notify → Create Webhook
2. Select **"Address Activity"** webhook type
3. Add wallet addresses to monitor
4. Set webhook URL: `https://yourdomain.com/api/webhooks/alchemy`
5. Copy the signing key → Add to `.env`:
   ```env
   ALCHEMY_WEBHOOK_SECRET="your-signing-key"
   ```

#### 4. Test Webhook (Local Development)
Use ngrok to expose local server:
```bash
npx ngrok http 3000
# Use the ngrok URL for webhook: https://xxxxx.ngrok.io/api/webhooks/alchemy
```

#### Supported Networks
- Ethereum (Mainnet + Sepolia)
- Base (Mainnet + Sepolia)
- Arbitrum (Mainnet + Sepolia)

**Note**: Lisk and BSC require custom RPC setup (not currently supported by Alchemy SDK)

---

## Project Structure

```
client/
├── app/
│   ├── api/                  # Backend API routes
│   │   ├── analytics/        # Analytics endpoints
│   │   ├── transactions/     # Transaction endpoints
│   │   └── user/             # User management
│   ├── dashboard/            # Dashboard pages (frontend)
│   │   ├── analytics/        # Advanced analytics
│   │   ├── reports/          # Report generation
│   │   ├── settings/         # User settings
│   │   ├── transactions/     # Transaction history
│   │   └── layout.tsx        # Dashboard layout
│   └── page.tsx              # Landing page
├── components/               # Reusable UI components
│   └── dashboard/            # Dashboard-specific components
├── hooks/                    # Custom React hooks
│   ├── useAnalytics.ts       # Analytics data fetching
│   ├── useTransactions.ts    # Transaction data fetching
│   └── useRoleAccess.ts      # Role-based access control
├── lib/
│   ├── api/utils.ts          # API utilities
│   ├── prisma.ts             # Database connection
│   └── utils/formatting.ts   # Data formatting utilities
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts               # Seed script
├── types/                    # TypeScript type definitions
└── config/                   # Wagmi/Reown configuration
```

---

## Wallet Integration (Reown AppKit)

This project uses **Reown AppKit** (formerly WalletConnect) for wallet connections.

### Supported Wallets

- MetaMask, Trust Wallet, Rainbow, Coinbase Wallet
- 100+ wallets via WalletConnect
- Social login: Google, X (Twitter), GitHub, Discord, Apple, Facebook
- Email authentication

### Supported Networks

**Mainnets:**
- Ethereum
- Base
- Arbitrum
- Lisk
- BSC (Binance Smart Chain)

**Testnets:**
- Sepolia, Base Sepolia, Arbitrum Sepolia, Lisk Sepolia, BSC Testnet

---

## Role-Based Access Control

### Roles

1. **Admin** - Full platform access
2. **Operations** - Transaction monitoring, user management
3. **Growth** - Analytics, user metrics
4. **Merchant** - Own transaction data, reports
5. **User** - Personal transaction history only

### Demo Role Assignment

Roles are assigned based on wallet address prefix (demo mode):
- `0x00...` or `0x11...` → Admin
- `0x22...` or `0x33...` → Operations
- `0x44...` or `0x55...` → Growth
- `0x66...` or `0x77...` → Merchant
- Others → User

**In production**: Roles are fetched from the database via `/api/user`

---

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](../LICENSE) for details.

---

## Support

- Documentation: [docs.kelopay.com](https://docs.kelopay.com)
- Issues: [GitHub Issues](https://github.com/Bandwidth-Labs/KeloPay/issues)
- Email: support@bandwidthlabs.io

---

Built with ❤️ by [Bandwidth Labs](https://bandwidthlabs.io)
