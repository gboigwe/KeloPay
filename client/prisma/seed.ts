// Database Seed Script
// Populates database with test data for development

import { PrismaClient, UserRole, TransactionType, TransactionStatus } from '@prisma/client'

const prisma = new PrismaClient()

const NETWORKS = ['ethereum', 'base', 'arbitrum', 'lisk', 'bsc']
const TOKENS = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH']
const TOKEN_ADDRESSES = {
  ETH: '0x0000000000000000000000000000000000000000',
  USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
  DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
  WETH: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Create test users with different roles
  const users = await Promise.all([
    // Admin user
    prisma.user.create({
      data: {
        walletAddress: '0x1111111111111111111111111111111111111111',
        email: 'admin@kelopay.com',
        role: UserRole.ADMIN,
        socialProvider: 'email',
      },
    }),
    // Operations user
    prisma.user.create({
      data: {
        walletAddress: '0x2222222222222222222222222222222222222222',
        email: 'operations@kelopay.com',
        role: UserRole.OPERATIONS,
      },
    }),
    // Growth user
    prisma.user.create({
      data: {
        walletAddress: '0x4444444444444444444444444444444444444444',
        role: UserRole.GROWTH,
      },
    }),
    // Merchant user
    prisma.user.create({
      data: {
        walletAddress: '0x6666666666666666666666666666666666666666',
        email: 'merchant@example.com',
        role: UserRole.MERCHANT,
        merchantId: 'MERCH001',
        merchantName: 'Test Merchant Store',
      },
    }),
    // Regular users
    ...Array.from({ length: 5 }, (_, i) =>
      prisma.user.create({
        data: {
          walletAddress: `0x${(8000 + i).toString().padStart(40, '0')}`,
          role: UserRole.USER,
        },
      })
    ),
  ])

  console.log(`✅ Created ${users.length} test users`)

  // Create test transactions
  const transactions = []
  const now = new Date()

  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)]
    const network = NETWORKS[Math.floor(Math.random() * NETWORKS.length)]
    const token = TOKENS[Math.floor(Math.random() * TOKENS.length)]
    const type = [
      TransactionType.DEPOSIT,
      TransactionType.WITHDRAWAL,
      TransactionType.CONVERSION,
      TransactionType.PAYMENT,
    ][Math.floor(Math.random() * 4)]

    const status = Math.random() > 0.1 ? TransactionStatus.COMPLETED : TransactionStatus.FAILED

    // Generate random amounts
    const tokenAmount = (Math.random() * 10 + 0.1).toFixed(6)
    const fiatAmount = parseFloat((Math.random() * 5000 + 100).toFixed(2))
    const exchangeRate = parseFloat((fiatAmount / parseFloat(tokenAmount)).toFixed(2))

    // Random timestamp within last 30 days
    const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000)

    transactions.push(
      prisma.transaction.create({
        data: {
          userId: user.id,
          txHash: `0x${Math.random().toString(16).substring(2).padEnd(64, '0')}`,
          blockNumber: BigInt(Math.floor(Math.random() * 1000000) + 15000000),
          timestamp,
          network,
          chainId: network === 'ethereum' ? 1 : network === 'base' ? 8453 : 42161,
          type,
          status,
          fromAddress: user.walletAddress,
          toAddress: `0x${Math.random().toString(16).substring(2).padEnd(40, '0')}`,
          fromTokenSymbol: token,
          fromTokenAddress: TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES],
          fromTokenAmount: tokenAmount,
          fromTokenDecimals: token === 'USDC' || token === 'USDT' ? 6 : 18,
          toFiatCurrency: 'USD',
          toFiatAmount: fiatAmount,
          exchangeRate,
          gasFeeWei: (Math.random() * 0.01 * 1e18).toFixed(0),
          gasFeeUSD: parseFloat((Math.random() * 10 + 1).toFixed(2)),
          platformFeeUSD: parseFloat((fiatAmount * 0.01).toFixed(2)),
          merchantId: user.role === UserRole.MERCHANT ? user.merchantId : null,
          merchantName: user.role === UserRole.MERCHANT ? user.merchantName : null,
        },
      })
    )
  }

  await Promise.all(transactions)
  console.log(`✅ Created ${transactions.length} test transactions`)

  console.log('🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
